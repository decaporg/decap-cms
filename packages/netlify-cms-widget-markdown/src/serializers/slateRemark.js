import { get, isEmpty, without, flatMap, last, map, sortBy, intersection } from 'lodash';
import u from 'unist-builder';

/**
 * Map of Slate node types to MDAST/Remark node types.
 */
const typeMap = {
  root: 'root',
  paragraph: 'paragraph',
  'heading-one': 'heading',
  'heading-two': 'heading',
  'heading-three': 'heading',
  'heading-four': 'heading',
  'heading-five': 'heading',
  'heading-six': 'heading',
  quote: 'blockquote',
  'code-block': 'code',
  'numbered-list': 'list',
  'bulleted-list': 'list',
  'list-item': 'listItem',
  table: 'table',
  'table-row': 'tableRow',
  'table-cell': 'tableCell',
  break: 'break',
  'thematic-break': 'thematicBreak',
  link: 'link',
  image: 'image',
  shortcode: 'shortcode',
};

/**
 * Map of Slate mark types to MDAST/Remark node types.
 */
const markMap = {
  bold: 'strong',
  italic: 'emphasis',
  strikethrough: 'delete',
  code: 'inlineCode',
};

export default function slateToRemark(raw, { voidCodeBlock }) {
  /**
   * The Slate Raw AST generally won't have a top level type, so we set it to
   * "root" for clarity.
   */
  raw.type = 'root';

  return transform(raw);

  /**
   * The transform function mimics the approach of a Remark plugin for
   * conformity with the other serialization functions. This function converts
   * Slate nodes to MDAST nodes, and recursively calls itself to process child
   * nodes to arbitrary depth.
   */
  function transform(node) {
    /**
     * Combine adjacent text and inline nodes before processing so they can
     * share marks.
     */
    const hasBlockChildren = node.nodes && node.nodes[0] && node.nodes[0].object === 'block';
    const children = hasBlockChildren ? node.nodes.map(transform) : convertInlineAndTextChildren(node.nodes);

    const output = convertBlockNode(node, children);
    console.log(output);
    return output;
  }

  function removeMarkFromNodes(nodes, markType) {
    return nodes.map(node => {
      if (node.object === 'inline') {
        const updatedNodes = removeMarkFromNodes(node.nodes, markType);
        return {
          ...node,
          nodes: updatedNodes,
        };
      }
      return {
        ...node,
        marks: node.marks.filter(({ type }) => type !== markType),
      }
    });
  }

  function getNodeMarks(node) {
    if (node.object === 'inline') {
      const childMarks = map(node.nodes, getNodeMarks);
      return intersection(...childMarks);
    }
    return node.marks.map(mark => mark.type);
  }

  function extractFirstMark(nodes) {
    let firstGroupMarks = getNodeMarks(nodes[0]);
    let splitIndex = 1;

    if (firstGroupMarks.length > 0) {
      while (splitIndex < nodes.length) {
        if (nodes[splitIndex]) {
          const sharedMarks = intersection(firstGroupMarks, getNodeMarks(nodes[splitIndex]));
          if (sharedMarks.length > 0) {
            firstGroupMarks = sharedMarks;
          } else {
            break;
          }
        }
        splitIndex += 1;
      }
    }

    const markType = firstGroupMarks[0];
    const childNodes = nodes.slice(0, splitIndex);
    const updatedChildNodes = markType ? removeMarkFromNodes(childNodes, markType) : childNodes;
    const remainingNodes = nodes.slice(splitIndex);

    return [markType, updatedChildNodes, remainingNodes];
  }

  function convertInlineAndTextChildren(nodes) {
    const convertedNodes = [];
    let remainingNodes = nodes;

    while (remainingNodes.length > 0) {
      const nextNode = remainingNodes[0];
      if (nextNode.object === 'inline' || nextNode.marks && nextNode.marks.length > 0) {
        const [markType, markNodes, remainder] = extractFirstMark(remainingNodes);
        if (!markType && markNodes.length === 1 && markNodes[0].object === 'inline') {
          const node = markNodes[0];
          convertedNodes.push(convertInlineNode(node, convertInlineAndTextChildren(node.nodes)));
        } else {
          const convertedNode = u(markMap[markType], convertInlineAndTextChildren(markNodes));
          convertedNodes.push(convertedNode);
        }
        remainingNodes = remainder;
      } else {
        remainingNodes.shift();
        convertedNodes.push(u('html', nextNode.text));
      }
    }

    return convertedNodes;
  }

  /**
   * Includes inline nodes as leaves in adjacent text nodes where appropriate, so
   * that mark node combining logic can apply to both text and inline nodes. This
   * is necessary because Slate doesn't allow inline nodes to have marks while
   * inline nodes in MDAST may be nested within mark nodes. Treating them as if
   * they were text is a bit of a necessary hack.
   */
  function combineTextAndInline(nodes) {
    const wrappedNodes = wrapInMarks(nodes);

    /**
     * Inlines
     * Get list of the marks that are present on every text node, which may be
     * nested in child inlines. The entire inline should be nested within those
     * marks. Children should be run through this function recursively.
     */
    return nodes.reduce((acc, node) => {
      if (['text', 'inline'].includes(node.object)) {
        const prevNode = last(acc);
        const data = node.data || {};

        /**
         * If the previous node has leaves and the current node has marks in data
         * (only happens when we place them on inline nodes here in the parser), or
         * the current node also has leaves (because the previous node was
         * originally an inline node that we've already squashed into a leaf),
         * combine the current node into the previous.
         */
        if (!isEmpty(prevNodeLeaves) && !isEmpty(data.marks)) {
          prevNodeLeaves.push({ node, marks: data.marks });
          return acc;
        }

        if (!isEmpty(prevNodeLeaves) && !isEmpty(node.leaves)) {
          prevNode.leaves = prevNodeLeaves.concat(node.leaves);
          return acc;
        }

        /**
         * Break nodes contain a single child text node with a newline character
         * for visual purposes in the editor, but Remark break nodes have no
         * children, so we remove the child node here.
         */
        if (node.type === 'break') {
          acc.push({ object: 'inline', type: 'break' });
          return acc;
        }

        // Convert remaining inline nodes to text nodes.
        if (node.object === 'inline') {
          acc.push({ object: 'text', text: node.text, marks: data.marks });
          return acc;
        }
      }

      /**
       * All other node types can be pushed as is.
       */
      acc.push(node);
      return acc;
    }, []);
  }

  /**
   * Slate treats inline code decoration as a standard mark, but MDAST does
   * not allow inline code nodes to contain children, only a single text
   * value. An MDAST inline code node can be nested within mark nodes such
   * as "emphasis" and "strong", but it cannot contain them.
   *
   * Because of this, if a "code" mark (translated to MDAST "inlineCode") is
   * in the markTypes array, we make the base text node an "inlineCode" type
   * instead of a standard text node.
   */
  function processCodeMark(markTypes) {
    const isInlineCode = markTypes.includes('inlineCode');
    const filteredMarkTypes = isInlineCode ? without(markTypes, 'inlineCode') : markTypes;
    const textNodeType = isInlineCode ? 'inlineCode' : 'html';
    return { filteredMarkTypes, textNodeType };
  }

  /**
   * Converts a Slate Raw text node to an MDAST text node.
   *
   * A Slate text node will have a text property containing a string of text,
   * and may contain an array of marks, such as "bold" or "italic". MDAST
   * instead expresses such marks in a nested structure, with individual nodes
   * for each mark type nested until the deepest mark node, which will contain
   * the text node.
   *
   * To convert a Slate text node's marks to MDAST, we recursively wrap the text
   * node with an MDAST node for each mark. For example, this Slate text node:
   *
   * {
   *   object: 'text',
   *   text: 'test',
   *   marks: ['bold', 'italic'],
   * }
   *
   * ...would be converted to this MDAST nested structure:
   *
   * {
   *   type: 'strong',
   *   children: [{
   *     type: 'emphasis',
   *     children: [{
   *       type: 'text',
   *       value: 'test',
   *     }],
   *   }],
   * }
   */
  function convertTextNode(node) {
    /**
     * If the Slate text node has a "leaves" property, translate the Slate AST to
     * a nested MDAST structure. Otherwise, just return an equivalent MDAST text
     * node.
     */
    if (node.leaves) {
      const processedLeaves = node.leaves.map(processLeaves);
      // Compensate for Slate including leading and trailing whitespace in styled text nodes, which
      // cannot be represented in markdown (https://github.com/netlify/netlify-cms/issues/1448)
      for (let i = 0; i < processedLeaves.length; i += 1) {
        const leaf = processedLeaves[i];
        if (leaf.marks.length > 0 && leaf.text && leaf.text.trim() !== leaf.text) {
          const [, leadingWhitespace, trailingWhitespace] = leaf.text.match(/^(\s*).*?(\s*)$/);
          // Move the leading whitespace to a separate unstyled leaf, unless the current leaf
          // is preceded by another one with (at least) the same marks applied:
          if (
            leadingWhitespace.length > 0 &&
            (i === 0 ||
              !leaf.marks.every(
                mark => processedLeaves[i - 1].marks && processedLeaves[i - 1].marks.includes(mark),
              ))
          ) {
            processedLeaves.splice(i, 0, {
              text: leadingWhitespace,
              marks: [],
              textNodeType: leaf.textNodeType,
            });
            i += 1;
            leaf.text = leaf.text.replace(/^\s+/, '');
          }
          // Move the trailing whitespace to a separate unstyled leaf, unless the current leaf
          // is followed by another one with (at least) the same marks applied:
          if (
            trailingWhitespace.length > 0 &&
            (i === processedLeaves.length - 1 ||
              !leaf.marks.every(
                mark => processedLeaves[i + 1].marks && processedLeaves[i + 1].marks.includes(mark),
              ))
          ) {
            processedLeaves.splice(i + 1, 0, {
              text: trailingWhitespace,
              marks: [],
              textNodeType: leaf.textNodeType,
            });
            i += 1;
            leaf.text = leaf.text.replace(/\s+$/, '');
          }
        }
      }
      const condensedNodes = processedLeaves.reduce(condenseNodesReducer, { nodes: [] });
      return condensedNodes.nodes;
    }

    if (node.object === 'inline') {
      return transform(node);
    }

    return u('html', node.text);
  }

  /**
   * Process Slate node leaves in preparation for MDAST transformation.
   */
  function processLeaves(leaf) {
    /**
     * Get an array of the mark types, converted to their MDAST equivalent
     * types.
     */
    const { marks = [], text } = leaf;
    const markTypes = marks.map(mark => markMap[mark.type]);

    if (typeof leaf.text === 'string') {
      /**
       * Code marks must be removed from the marks array, and the presence of a
       * code mark changes the text node type that should be used.
       */
      const { filteredMarkTypes, textNodeType } = processCodeMark(markTypes);
      return { text, marks: filteredMarkTypes, textNodeType };
    }

    return { node: leaf.node, marks: markTypes };
  }

  /**
   * Slate's AST doesn't group adjacent text nodes with the same marks - a
   * change in marks from letter to letter, even if some are in common, results
   * in a separate leaf. For example, given "**a_b_**", transformation to and
   * from Slate's AST will result in "**a****_b_**".
   *
   * MDAST treats styling entities as distinct nodes that contain children, so a
   * "strong" node can contain a plain text node with a sibling "emphasis" node,
   * which contains more text. This reducer serves to create an optimized nested
   * MDAST without the typical redundancies that Slate's AST would produce if
   * transformed as-is. The reducer can be called recursively to produce nested
   * structures.
   */
  function condenseNodesReducer(acc, node, idx, nodes) {
    /**
     * Skip any nodes that are being processed as children of an MDAST node
     * through recursive calls.
     */
    if (typeof acc.nextIndex === 'number' && acc.nextIndex > idx) {
      return acc;
    }

    /**
     * Processing for nodes with marks.
     */
    if (node.marks && node.marks.length > 0) {
      /**
       * For each mark on the current node, get the number of consecutive nodes
       * (starting with this one) that have the mark. Whichever mark covers the
       * most nodes is used as the parent node, and the nodes with that mark are
       * processed as children. If the greatest number of consecutive nodes is
       * tied between multiple marks, there is no priority as to which goes
       * first.
       */
      const markLengths = node.marks.map(mark => getMarkLength(mark, nodes.slice(idx)));
      const parentMarkLength = last(sortBy(markLengths, 'length'));
      const { markType: parentType, length: parentLength } = parentMarkLength;

      /**
       * Since this and any consecutive nodes with the parent mark are going to
       * be processed as children of the parent mark, this reducer should simply
       * return the accumulator until after the last node to be covered by the
       * new parent node. Here we set the next index that should be processed,
       * if any.
       */
      const newNextIndex = idx + parentLength;

      /**
       * Get the set of nodes that should be processed as children of the new
       * parent mark node, run each through the reducer as children of the
       * parent node, and create the parent MDAST node with the resulting
       * children.
       */
      const children = nodes.slice(idx, newNextIndex);
      const denestedChildren = children.map(child => ({
        ...child,
        marks: without(child.marks, parentType),
      }));
      const mdastChildren = denestedChildren.reduce(condenseNodesReducer, { nodes: [], parentType })
        .nodes;
      const mdastNode = u(parentType, mdastChildren);

      return { ...acc, nodes: [...acc.nodes, mdastNode], nextIndex: newNextIndex };
    }

    /**
     * Create the base text node, and pass in the array of mark types as data
     * (helpful when optimizing/condensing the final structure).
     */
    const baseNode =
      typeof node.text === 'string'
        ? u(node.textNodeType, { marks: node.marks }, node.text)
        : node.node && transform(node.node);

    /**
     * Recursively wrap the base text node in the individual mark nodes, if
     * any exist.
     */
    return { ...acc, nodes: [...acc.nodes, ...(baseNode ? [baseNode] : [])] };
  }

  /**
   * Get the number of consecutive Slate nodes containing a given mark beginning
   * from the first received node.
   */
  function getMarkLength(markType, nodes) {
    let length = 0;
    while (nodes[length] && nodes[length].marks.includes(markType)) {
      ++length;
    }
    return { markType, length };
  }

  /**
   * Convert a single Slate Raw node to an MDAST node. Uses the unist-builder `u`
   * function to create MDAST nodes.
   */
  function convertBlockNode(node, children) {
    switch (node.type) {
      /**
       * General
       *
       * Convert simple cases that only require a type and children, with no
       * additional properties.
       */
      case 'root':
      case 'paragraph':
      case 'quote':
      case 'list-item':
      case 'table':
      case 'table-row':
      case 'table-cell': {
        return u(typeMap[node.type], children);
      }

      /**
       * Shortcodes
       *
       * Shortcode nodes only exist in Slate's Raw AST if they were inserted
       * via the plugin toolbar in memory, so they should always have
       * shortcode data attached. The "shortcode" data property contains the
       * name of the registered shortcode plugin, and the "shortcodeData" data
       * property contains the data received from the shortcode plugin's
       * `fromBlock` method when the shortcode node was created.
       *
       * Here we create a `shortcode` MDAST node that contains only the shortcode
       * data.
       */
      case 'shortcode': {
        const { data } = node;
        return u(typeMap[node.type], { data });
      }

      /**
       * Headings
       *
       * Slate schemas don't usually infer basic type info from data, so each
       * level of heading is a separately named type. The MDAST schema just
       * has a single "heading" type with the depth stored in a "depth"
       * property on the node. Here we derive the depth from the Slate node
       * type - e.g., for "heading-two", we need a depth value of "2".
       */
      case 'heading-one':
      case 'heading-two':
      case 'heading-three':
      case 'heading-four':
      case 'heading-five':
      case 'heading-six': {
        const depthMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
        const depthText = node.type.split('-')[1];
        const depth = depthMap[depthText];
        return u(typeMap[node.type], { depth }, children);
      }

      /**
       * Code Blocks
       *
       * Code block nodes may have a single text child, or instead be void and
       * store their value in `data.code`. They also may have a code language
       * stored in the "lang" data property. Here we transfer both the node value
       * and the "lang" data property to the new MDAST node, and spread any
       * remaining data as `data`.
       */
      case 'code-block': {
        const { lang, code, ...data } = get(node, 'data', {});
        const value = voidCodeBlock ? code : flatMap(node.nodes, child => {
          return flatMap(child.leaves, 'text');
        }).join('');
        return u(typeMap[node.type], { lang, data }, value || '');
      }

      /**
       * Lists
       *
       * Our Slate schema has separate node types for ordered and unordered
       * lists, but the MDAST spec uses a single type with a boolean "ordered"
       * property to indicate whether the list is numbered. The MDAST spec also
       * allows for a "start" property to indicate the first number used for an
       * ordered list. Here we translate both values to our Slate schema.
       */
      case 'numbered-list':
      case 'bulleted-list': {
        const ordered = node.type === 'numbered-list';
        const props = { ordered, start: get(node.data, 'start') || 1 };
        return u(typeMap[node.type], props, children);
      }

      /**
       * Thematic Break
       *
       * Thematic break is a block level break. They cannot have children.
       */
      case 'thematic-break': {
        return u(typeMap[node.type]);
      }
    }
  }

  function convertInlineNode(node, children) {
    switch (node.type) {

      /**
       * Break
       *
       * Breaks are phrasing level breaks. They cannot have children.
       */
      case 'break': {
        return u(typeMap[node.type]);
      }

      /**
       * Links
       *
       * The url and title attributes of link nodes are stored in properties on
       * the node for both Slate and Remark schemas.
       */
      case 'link': {
        const { url, title, ...data } = get(node, 'data', {});
        return u(typeMap[node.type], { url, title, data }, children);
      }

      /**
       * Images
       *
       * This transformation is almost identical to that of links, except for the
       * lack of child nodes and addition of `alt` attribute data.
       */
      case 'image': {
        const { url, title, alt, ...data } = get(node, 'data', {});
        return u(typeMap[node.type], { url, title, alt, data });
      }
    }
  }
}
