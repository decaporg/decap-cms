import { get, without, last, map, intersection, omit } from 'lodash';
import u from 'unist-builder';
import mdastToString from 'mdast-util-to-string';

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
  delete: 'delete',
  code: 'inlineCode',
};

const blockTypes = [
  'paragraph',
  'quote',
  'heading-one',
  'heading-two',
  'heading-three',
  'heading-four',
  'heading-five',
  'heading-six',
  'bulleted-list',
  'numbered-list',
  'list-item',
  'shortcode',
  'table',
  'table-row',
  'table-cell',
];

const inlineTypes = ['link', 'image', 'break'];

const leadingWhitespaceExp = /^\s+\S/;
const trailingWhitespaceExp = /(?!\S)\s+$/;

export default function slateToRemark(value, { voidCodeBlock }) {
  /**
   * The Slate Raw AST generally won't have a top level type, so we set it to
   * "root" for clarity.
   */
  const root = {
    type: 'root',
    children: value,
  };

  return transform(root);

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
    const hasBlockChildren =
      node.children && node.children[0] && blockTypes.includes(node.children[0].type);
    const children = hasBlockChildren
      ? node.children.map(transform).filter(v => v)
      : convertInlineAndTextChildren(node.children);

    const output = convertBlockNode(node, children);
    //console.log(JSON.stringify(output, null, 2));
    return output;
  }

  function removeMarkFromNodes(nodes, markType) {
    return nodes.map(node => {
      const newNode = { ...node };
      switch (node.type) {
        case 'link': {
          const updatedNodes = removeMarkFromNodes(node.children, markType);
          return {
            ...node,
            children: updatedNodes,
          };
        }

        case 'image':
        case 'break': {
          const data = omit(node.data, 'marks');
          return { ...node, data };
        }

        default:
          delete newNode[markType];
          newNode.marks = newNode.marks
            ? newNode.marks.filter(({ type }) => type !== markType)
            : [];

          if (newNode.marks.length === 0) {
            delete newNode.marks;
          }
          return newNode;
      }
    });
  }

  function getNodeMarks(node) {
    switch (node.type) {
      case 'link': {
        // Code marks can't always be condensed together. If all text in a link
        // is wrapped in a mark, this function returns that mark and the node
        // ends up nested inside of that mark. Code marks sometimes can't do
        // that, like when they wrap all of the text content of a link. Here we
        // remove code marks before processing so that they stay put.
        const nodesWithoutCode = node.children.map(n => {
          const newNode = { ...n };
          (newNode.marks = n.marks ? n.marks.filter(({ type }) => type !== 'code') : n.marks),
            delete newNode.code;
          return newNode;
        });
        const childMarks = map(nodesWithoutCode, getNodeMarks);
        return intersection(...childMarks);
      }

      case 'break':
      case 'image':
        return map(get(node, ['data', 'marks']), mark => mark.type);

      default:
        return getNodeMarkArray(node);
    }
  }

  function getNodeMarkArray(node) {
    return Object.keys(markMap).filter(mark => !!node[mark]);
  }

  function getSharedMarks(marks, node) {
    const nodeMarks = getNodeMarks(node);
    const sharedMarks = intersection(marks, nodeMarks);
    if (sharedMarks[0] === 'code') {
      return nodeMarks.length === 1 ? marks : [];
    }
    return sharedMarks;
  }

  function extractFirstMark(nodes) {
    let firstGroupMarks = getNodeMarks(nodes[0]) || [];

    // If code mark is present, but there are other marks, process others first.
    // If only the code mark is present, don't allow it to be shared with other
    // nodes.
    if (firstGroupMarks[0] === 'code' && firstGroupMarks.length > 1) {
      firstGroupMarks = [...without('firstGroupMarks', 'code'), 'code'];
    }

    let splitIndex = 1;

    if (firstGroupMarks.length > 0) {
      while (splitIndex < nodes.length) {
        if (nodes[splitIndex]) {
          const sharedMarks = getSharedMarks(firstGroupMarks, nodes[splitIndex]);
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

  /**
   * Converts the strings returned from `splitToNamedParts` to Slate nodes.
   */
  function splitWhitespace(node, { trailing } = {}) {
    if (!node.text) {
      return { trimmedNode: node };
    }
    const exp = trailing ? trailingWhitespaceExp : leadingWhitespaceExp;
    const index = node.text.search(exp);
    if (index > -1) {
      const substringIndex = trailing ? index : index + 1;
      const firstSplit = node.text.slice(0, substringIndex);
      const secondSplit = node.text.slice(substringIndex);
      const whitespace = trailing ? secondSplit : firstSplit;
      const text = trailing ? firstSplit : secondSplit;
      return { whitespace, trimmedNode: { ...node, text } };
    }
    return { trimmedNode: node };
  }

  function collectCenterNodes(nodes, leadingNode, trailingNode) {
    switch (nodes.length) {
      case 0:
        return [];
      case 1:
        return [trailingNode];
      case 2:
        return [leadingNode, trailingNode];
      default:
        return [leadingNode, ...nodes.slice(1, -1), trailingNode];
    }
  }

  function normalizeFlankingWhitespace(nodes) {
    const { whitespace: leadingWhitespace, trimmedNode: leadingNode } = splitWhitespace(nodes[0]);
    const lastNode = nodes.length > 1 ? last(nodes) : leadingNode;
    const trailingSplitResult = splitWhitespace(lastNode, { trailing: true });
    const { whitespace: trailingWhitespace, trimmedNode: trailingNode } = trailingSplitResult;
    const centerNodes = collectCenterNodes(nodes, leadingNode, trailingNode).filter(val => val);
    return { leadingWhitespace, centerNodes, trailingWhitespace };
  }

  function createText(text) {
    return text && u('html', text);
  }

  function isNodeInline(node) {
    return inlineTypes.includes(node.type);
  }

  function convertInlineAndTextChildren(nodes = []) {
    const convertedNodes = [];
    let remainingNodes = [...nodes];

    while (remainingNodes.length > 0) {
      const nextNode = remainingNodes[0];

      if (isNodeInline(nextNode) || getNodeMarkArray(nextNode).length > 0) {
        const [markType, markNodes, remainder] = extractFirstMark(remainingNodes);
        /**
         * A node with a code mark will be a text node, and will not be adjacent
         * to a sibling code node as the Slate schema requires them to be
         * merged. Markdown also requires at least a space between inline code
         * nodes.
         */
        if (markType === 'code') {
          const node = markNodes[0];
          convertedNodes.push(u(markMap[markType], node.data, node.text));
        } else if (!markType && markNodes.length === 1 && isNodeInline(nextNode)) {
          const node = markNodes[0];
          convertedNodes.push(convertInlineNode(node, convertInlineAndTextChildren(node.children)));
        } else {
          const { leadingWhitespace, trailingWhitespace, centerNodes } =
            normalizeFlankingWhitespace(markNodes);
          const children = convertInlineAndTextChildren(centerNodes);
          const markNode = u(markMap[markType], children);

          // Filter out empty marks, otherwise their output literally by
          // remark-stringify, eg. an empty bold node becomes "****"
          if (mdastToString(markNode) === '') {
            remainingNodes = remainder;
            continue;
          }

          const normalizedNodes = [
            createText(leadingWhitespace),
            markNode,
            createText(trailingWhitespace),
          ].filter(val => val);
          convertedNodes.push(...normalizedNodes);
        }
        remainingNodes = remainder;
      } else if (nextNode.type === 'break') {
        remainingNodes = remainingNodes.slice(1);
        convertedNodes.push(convertInlineNode(nextNode));
      } else {
        remainingNodes.shift();
        convertedNodes.push(u('html', nextNode.text));
      }
    }

    return convertedNodes;
  }

  function convertCodeBlock(node) {
    return {
      ...node,
      type: 'code-block',
      data: {
        ...node.data,
        ...node.data.shortcodeData,
      },
    };
  }

  function convertBlockNode(node, children) {
    if (node.type == 'shortcode' && node.data.shortcode == 'code-block') {
      node = convertCodeBlock(node);
    }

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
       * Lists
       *
       * Enclose list items in paragraphs
       */
      // case 'list-item':
      //   return u(typeMap[node.type], [{ type: 'paragraph', children }]);

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
        const mdastNode = u(typeMap[node.type], { depth }, children);
        if (mdastToString(mdastNode)) {
          return mdastNode;
        }
        return;
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
        const value = voidCodeBlock ? code : children[0]?.value;
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
       * Url is now stored in data for slate, so we need to pull it out.
       */
      case 'link': {
        const { title, data } = node;
        return u(typeMap[node.type], { url: node.url, title, ...data }, children);
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
