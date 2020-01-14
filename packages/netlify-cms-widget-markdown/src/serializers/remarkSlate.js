import { isEmpty, isArray, flatMap, map, flatten } from 'lodash';

/**
 * Map of MDAST node types to Slate node types.
 */
const typeMap = {
  root: 'root',
  paragraph: 'paragraph',
  blockquote: 'quote',
  code: 'code-block',
  listItem: 'list-item',
  table: 'table',
  tableRow: 'table-row',
  tableCell: 'table-cell',
  thematicBreak: 'thematic-break',
  link: 'link',
  image: 'image',
  shortcode: 'shortcode',
};

/**
 * Map of MDAST node types to Slate mark types.
 */
const markMap = {
  strong: 'bold',
  emphasis: 'italic',
  delete: 'strikethrough',
  inlineCode: 'code',
};

const isInline = node => node.object === 'inline';
const isText = node => node.object === 'text';

export const wrapInlinesWithTexts = children => {
  if (children.length <= 0) {
    return children;
  }

  const insertLocations = [];
  let prev = children[0];
  if (isInline(prev)) {
    insertLocations.push(0);
  }

  for (let i = 1; i < children.length; i++) {
    const current = children[i];
    if (isInline(prev) && !isText(current)) {
      insertLocations.push(i);
    } else if (!isText(prev) && isInline(current)) {
      insertLocations.push(i);
    }

    prev = current;
  }

  if (isInline(prev)) {
    insertLocations.push(children.length);
  }

  for (let i = 0; i < insertLocations.length; i++) {
    children.splice(insertLocations[i] + i, 0, { object: 'text', text: '' });
  }

  return children;
};

/**
 * A Remark plugin for converting an MDAST to Slate Raw AST. Remark plugins
 * return a `transformNode` function that receives the MDAST as it's first argument.
 */
export default function remarkToSlate({ voidCodeBlock } = {}) {
  return transformNode;

  function transformNode(node) {
    /**
     * Call `transformNode` recursively on child nodes.
     *
     * If a node returns a falsey value, filter it out. Some nodes do not
     * translate from MDAST to Slate, such as definitions for link/image
     * references or footnotes.
     */
    let children =
      !['strong', 'emphasis', 'delete'].includes(node.type) &&
      !isEmpty(node.children) &&
      flatMap(node.children, transformNode).filter(val => val);

    if (Array.isArray(children)) {
      // Ensure that inline nodes are surrounded by text nodes to conform to slate schema
      children = wrapInlinesWithTexts(children);
    }

    /**
     * Run individual nodes through the conversion factory.
     */
    const output = convertNode(node, children || undefined);
    return output;
  }

  /**
   * Add nodes to a parent node only if `nodes` is truthy.
   */
  function addNodes(parent, nodes) {
    return nodes ? { ...parent, nodes } : parent;
  }

  /**
   * Create a Slate Block node.
   */
  function createBlock(type, nodes, props = {}) {
    if (!isArray(nodes)) {
      props = nodes;
      nodes = undefined;
    }

    // Ensure block nodes have at least one text child to conform to slate schema
    const children = isEmpty(nodes) ? [createText('')] : nodes;
    const node = { object: 'block', type, ...props };
    return addNodes(node, children);
  }

  /**
   * Create a Slate Inline node.
   */
  function createInline(type, props = {}, nodes) {
    const node = { object: 'inline', type, ...props };

    // Ensure inline nodes have at least one text child to conform to slate schema
    const children = isEmpty(nodes) ? [createText('')] : nodes;
    return addNodes(node, children);
  }

  /**
   * Create a Slate Raw text node.
   */
  function createText(node) {
    const newNode = { object: 'text' };
    if (typeof node === 'string') {
      return { ...newNode, text: node };
    }
    const { text, marks } = node;
    return { ...newNode, text, marks };
  }

  function processMarkChild(childNode, marks) {
    switch (childNode.type) {
      /**
       * If a text node is a direct child of the current node, it should be
       * set aside as a text, and all marks that have been collected in the
       * `marks` array should apply to that specific text.
       */
      case 'html':
      case 'text':
        return { ...convertNode(childNode), marks };

      /**
       * MDAST inline code nodes don't have children, just a text value, similar
       * to a text node, so it receives the same treatment as a text node, but we
       * first add the inline code mark to the marks array.
       */
      case 'inlineCode': {
        const childMarks = [...marks, { type: markMap[childNode.type] }];
        return { ...convertNode(childNode), marks: childMarks };
      }

      /**
       * Process nested style nodes. The recursive results should be pushed into
       * the texts array. This way, every MDAST nested text structure becomes a
       * flat array of texts that can serve as the value of a single Slate Raw
       * text node.
       */
      case 'strong':
      case 'emphasis':
      case 'delete':
        return processMarkNode(childNode, marks);

      case 'link': {
        const nodes = map(childNode.children, child => processMarkChild(child, marks));
        const result = convertNode(childNode, flatten(nodes));
        return result;
      }

      /**
       * Remaining nodes simply need mark data added to them, and to then be
       * added into the cumulative children array.
       */
      default:
        return transformNode({ ...childNode, data: { ...childNode.data, marks } });
    }
  }

  function processMarkNode(node, parentMarks = []) {
    /**
     * Add the current node's mark type to the marks collected from parent
     * mark nodes, if any.
     */
    const markType = markMap[node.type];
    const marks = markType ? [...parentMarks, { type: markMap[node.type] }] : parentMarks;

    const children = flatMap(node.children, child => processMarkChild(child, marks));

    return children;
  }

  /**
   * Convert a single MDAST node to a Slate Raw node. Uses local node factories
   * that mimic the unist-builder function utilized in the slateRemark
   * transformer.
   */
  function convertNode(node, nodes) {
    switch (node.type) {
      /**
       * General
       *
       * Convert simple cases that only require a type and children, with no
       * additional properties.
       */
      case 'root':
      case 'paragraph':
      case 'blockquote':
      case 'tableRow':
      case 'tableCell': {
        return createBlock(typeMap[node.type], nodes);
      }

      /**
       * List Items
       *
       * Markdown list items can be empty, but a list item in the Slate schema
       * should at least have an empty paragraph node.
       */
      case 'listItem': {
        const children = isEmpty(nodes) ? [createBlock('paragraph')] : nodes;
        return createBlock(typeMap[node.type], children);
      }

      /**
       * Shortcodes
       *
       * Shortcode nodes are represented as "void" blocks in the Slate AST. They
       * maintain the same data as MDAST shortcode nodes. Slate void blocks must
       * contain a blank text node.
       */
      case 'shortcode': {
        const nodes = [createText('')];
        const data = { ...node.data };
        return createBlock(typeMap[node.type], nodes, { data });
      }

      /**
       * Text
       *
       * Text nodes contain plain text. We remove newlines because they don't
       * carry meaning for a rich text editor - a break in rich text would be
       * expected to result in a break in output HTML, but that isn't the case.
       * To avoid this confusion we remove them.
       */
      case 'text': {
        const text = node.value.replace(/\n/, ' ');
        return createText(text);
      }

      /**
       * HTML
       *
       * HTML nodes contain plain text like text nodes, except they only contain
       * HTML. Our serialization results in non-HTML being placed in HTML nodes
       * sometimes to ensure that we're never escaping HTML from the rich text
       * editor. We do not replace line feeds in HTML because the HTML is raw
       * in the rich text editor, so the writer knows they're writing HTML, and
       * should expect soft breaks to be visually absent in the rendered HTML.
       */
      case 'html': {
        return createText(node.value);
      }

      /**
       * Inline Code
       *
       * Inline code nodes from an MDAST are represented in our Slate schema as
       * text nodes with a "code" mark. We manually create the text containing
       * the inline code value and a "code" mark, and place it in an array for use
       * as a Slate text node's children array.
       */
      case 'inlineCode': {
        return createText({ text: node.value, marks: [{ type: 'code' }] });
      }

      /**
       * Marks
       *
       * Marks are typically decorative sub-types that apply to text nodes. In an
       * MDAST, marks are nodes that can contain other nodes. This nested
       * hierarchy has to be flattened and split into distinct text nodes with
       * their own set of marks.
       */
      case 'strong':
      case 'emphasis':
      case 'delete': {
        return processMarkNode(node);
      }

      /**
       * Headings
       *
       * MDAST headings use a single type with a separate "depth" property to
       * indicate the heading level, while the Slate schema uses a separate node
       * type for each heading level. Here we get the proper Slate node name based
       * on the MDAST node depth.
       */
      case 'heading': {
        const depthMap = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
        const slateType = `heading-${depthMap[node.depth]}`;
        return createBlock(slateType, nodes);
      }

      /**
       * Code Blocks
       *
       * MDAST code blocks are a distinct node type with a simple text value. We
       * convert that value into a nested child text node for Slate. If a void
       * node is required due to a custom code block handler, the value is
       * stored in the "code" data property instead. We also carry over the "lang"
       * data property if it's defined.
       */
      case 'code': {
        const data = {
          lang: node.lang,
          ...(voidCodeBlock ? { code: node.value } : {}),
        };
        const text = createText(voidCodeBlock ? '' : node.value);
        const nodes = [text];
        const block = createBlock(typeMap[node.type], nodes, { data });
        return block;
      }

      /**
       * Lists
       *
       * MDAST has a single list type and an "ordered" property. We derive that
       * information into the Slate schema's distinct list node types. We also
       * include the "start" property, which indicates the number an ordered list
       * starts at, if defined.
       */
      case 'list': {
        const slateType = node.ordered ? 'numbered-list' : 'bulleted-list';
        const data = { start: node.start };
        return createBlock(slateType, nodes, { data });
      }

      /**
       * Breaks
       *
       * MDAST soft break nodes represent a trailing double space or trailing
       * slash from a Markdown document. In Slate, these are simply transformed to
       * line breaks within a text node.
       */
      case 'break': {
        const { data } = node;
        return createInline('break', { data });
      }

      /**
       * Thematic Breaks
       *
       * Thematic breaks are void nodes in the Slate schema.
       */
      case 'thematicBreak': {
        return createBlock(typeMap[node.type]);
      }

      /**
       * Links
       *
       * MDAST stores the link attributes directly on the node, while our Slate
       * schema references them in the data object.
       */
      case 'link': {
        const { title, url, data } = node;
        const newData = { ...data, title, url };
        return createInline(typeMap[node.type], { data: newData }, nodes);
      }

      /**
       * Images
       *
       * Identical to link nodes except for the lack of child nodes and addition
       * of alt attribute data MDAST stores the link attributes directly on the
       * node, while our Slate schema references them in the data object.
       */
      case 'image': {
        const { title, url, alt, data } = node;
        const newData = { ...data, title, alt, url };
        return createInline(typeMap[node.type], { data: newData });
      }

      /**
       * Tables
       *
       * Tables are parsed separately because they may include an "align"
       * property, which should be passed to the Slate node.
       */
      case 'table': {
        const data = { align: node.align };
        return createBlock(typeMap[node.type], nodes, { data });
      }
    }
  }
}
