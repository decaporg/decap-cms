import { get, isEmpty, without, flatMap, last, sortBy } from 'lodash';
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
  code: 'code',
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

let shortcodePlugins;

export default function slateToRemark(raw, opts) {
  /**
   * Set shortcode plugins in outer scope.
   */
  ({ shortcodePlugins } = opts);

  /**
   * The Slate Raw AST generally won't have a top level type, so we set it to
   * "root" for clarity.
   */
  raw.type = 'root';

  return transform(raw);
}

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
  const combinedChildren = node.nodes && combineTextAndInline(node.nodes);

  /**
   * Call `transform` recursively on child nodes, and flatten the resulting
   * array.
   */
  const children = !isEmpty(combinedChildren) && flatMap(combinedChildren, transform);

  /**
   * Run individual nodes through conversion factories.
   */
  return ['text'].includes(node.object)
    ? convertTextNode(node)
    : convertNode(node, children, shortcodePlugins);
}

/**
 * Includes inline nodes as leaves in adjacent text nodes where appropriate, so
 * that mark node combining logic can apply to both text and inline nodes. This
 * is necessary because Slate doesn't allow inline nodes to have marks while
 * inline nodes in MDAST may be nested within mark nodes. Treating them as if
 * they were text is a bit of a necessary hack.
 */
function combineTextAndInline(nodes) {
  return nodes.reduce((acc, node) => {
    const prevNode = last(acc);
    const prevNodeLeaves = get(prevNode, 'leaves');
    const data = node.data || {};

    /**
     * If the previous node has leaves and the current node has marks in data
     * (only happens when we place them on inline nodes here in the parser), or
     * the current node also has leaves (because the previous node was
     * originally an inline node that we've already squashed into a leaf)
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

    /**
     * Convert remaining inline nodes to standalone text nodes with leaves.
     */
    if (node.object === 'inline') {
      acc.push({ object: 'text', leaves: [{ node, marks: data.marks }] });
      return acc;
    }

    /**
     * Only remaining case is an actual text node, can be pushed as is.
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
 * Slate text nodes without marks often simply have a "text" property with
 * the value. In this case the conversion to MDAST is simple. If a Slate
 * text node does not have a "text" property, it will instead have a
 * "leaves" property containing an array of objects, each with an array of
 * marks, such as "bold" or "italic", along with a "text" property.
 *
 * MDAST instead expresses such marks in a nested structure, with individual
 * nodes for each mark type nested until the deepest mark node, which will
 * contain the text node.
 *
 * To convert a Slate text node's marks to MDAST, we treat each "leaf" as a
 * separate text node, convert the text node itself to an MDAST text node,
 * and then recursively wrap the text node for each mark, collecting the results
 * of each leaf in a single array of child nodes.
 *
 * For example, this Slate text node:
 *
 * {
 *   object: 'text',
 *   leaves: [
 *     {
 *       text: 'test',
 *       marks: ['bold', 'italic']
 *     },
 *     {
 *       text: 'test two'
 *     }
 *   ]
 * }
 *
 * ...would be converted to this MDAST nested structure:
 *
 * [
 *   {
 *     type: 'strong',
 *     children: [{
 *       type: 'emphasis',
 *       children: [{
 *         type: 'text',
 *         value: 'test'
 *       }]
 *     }]
 *   },
 *   {
 *     type: 'text',
 *     value: 'test two'
 *   }
 * ]
 *
 * This example also demonstrates how a single Slate node may need to be
 * replaced with multiple MDAST nodes, so the resulting array must be flattened.
 */
function convertTextNode(node) {
  /**
   * If the Slate text node has a "leaves" property, translate the Slate AST to
   * a nested MDAST structure. Otherwise, just return an equivalent MDAST text
   * node.
   */
  if (node.leaves) {
    const processedLeaves = node.leaves.map(processLeaves);
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
      : transform(node.node);

  /**
   * Recursively wrap the base text node in the individual mark nodes, if
   * any exist.
   */
  return { ...acc, nodes: [...acc.nodes, baseNode] };
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
 * function to create MDAST nodes and parses shortcodes.
 */
function convertNode(node, children, shortcodePlugins) {
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
     * Here we get the shortcode plugin from the registry and use it's
     * `toBlock` method to recreate the original markdown shortcode. We then
     * insert that text into a new "html" type node (a "text" type node
     * might get encoded or escaped by remark-stringify). Finally, we wrap
     * the "html" node in a "paragraph" type node, as shortcode nodes must
     * be alone in their own paragraph.
     */
    case 'shortcode': {
      const { data } = node;
      const plugin = shortcodePlugins.get(data.shortcode);
      const text = plugin.toBlock(data.shortcodeData);
      const textNode = u('html', text);
      return u('paragraph', { data }, [textNode]);
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
     * Code block nodes have a single text child, and may have a code language
     * stored in the "lang" data property. Here we transfer both the node
     * value and the "lang" data property to the new MDAST node.
     */
    case 'code': {
      const value = flatMap(node.nodes, child => {
        return flatMap(child.leaves, 'text');
      }).join('');
      const { lang, ...data } = get(node, 'data', {});
      return u(typeMap[node.type], { lang, data }, value);
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
     * Breaks
     *
     * Breaks don't have children. We parse them separately for clarity.
     */
    case 'break':
    case 'thematic-break': {
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
     * lack of child nodes and addition of `alt` attribute data. Currently the
     * CMS handles block images by shortcode, so this case will only apply to
     * inline images, which currently can only occur through raw markdown
     * insertion.
     */
    case 'image': {
      const { url, title, alt, ...data } = get(node, 'data', {});
      return u(typeMap[node.type], { url, title, alt, data });
    }

    /**
     * No default case is supplied because an unhandled case should never
     * occur. In the event that it does, let the error throw (for now).
     */
  }
}
