import unified from 'unified';
import markdown from 'remark-parse';
import { Mark } from 'prosemirror-model';
import isEmpty from 'lodash/isEmpty';

let schema;
let plugins
let activeMarks = Mark.none;
let textsArray = [];

/**
 * A remark plugin for converting an MDAST to a ProseMirror tree.
 * @returns {function} a transformer function
 */
function markdownToProseMirror() {
  return transform;
}

/**
 * The MDAST transformer function.
 * @param {object} node an MDAST node
 * @returns {Node} a ProseMirror Node
 */
function transform(node) {
  if (node.type === 'text') {
    processText(node.value);
    return;
  }

  const nodeDef = getNodeDef(node);

  if (!nodeDef) {
    return node;
  }

  return (nodeDef.block ? processBlock : processInline)(nodeDef, node.children, node.value);
}

/**
 * Provides required information for converting an MDAST node into a ProseMirror
 * Node.
 *
 * @param {object} node - an MDAST node
 * @returns {object} conversion data node with the following shape:
 *   {string} pmType - the equivalent node type in the ProseMirror schema
 *   {boolean} block - true if the node is block level, otherwise false
 *   {object} attrs - passed to ProseMirror's schema mark/node creation methods
 *   {object} content - overrides `node.children` as node content
 *   {Node} defaultContent - content to use if node has no content (default: null)
 *   {boolean} canContainPlugins true for nodes that may contain plugins
 */
function getNodeDef({ type, ordered, lang, value, depth, url, alt }) {
  switch (type) {
    case 'root':
      return { pmType: 'doc', block: true, defaultContent: schema.node('paragraph') };
    case 'heading':
      return { pmType: type, attrs: { level: depth }, hasText: true, block: true };
    case 'paragraph':
      return { pmType: type, hasText: true, block: true, canContainPlugins: true };
    case 'blockquote':
      return { pmType: type, block: true };
    case 'list':
      return { pmType: ordered ? 'ordered_list' : 'bullet_list', attrs: { tight: true }, block: true };
    case 'listItem':
      return { pmType: 'list_item', block: true };
    case 'thematicBreak':
      return { pmType: 'horizontal_rule', block: true };
    case 'break':
      return { pmType: 'hard_break', block: true };
    case 'image':
      return { pmType: type, block: true, attrs: { src: url, alt } };
    case 'code':
      return { pmType: 'code_block', attrs: { params: lang },  content: schema.text(value), block: true };
    case 'emphasis':
      return { pmType: 'em' };
    case 'strong':
      return { pmType: type };
    case 'link':
      return { pmType: 'strong' };
    case 'inlineCode':
      return { pmType: 'code' };
  }
}

/**
 * Derives content from block nodes. Block nodes containing raw text, such as
 * headings and paragraphs, are processed differently than block nodes
 * containing other node types.
 * @param {array} children child nodes
 * @param {boolean} hasText if true, the node contains raw text nodes
 * @returns {array} processed child nodes
 */
function getBlockContent(children, hasText) {
  // children.map will return undefined for text nodes, so we filter those out
  const processedChildren = children.map(transform).filter(val => val);

  if (hasText) {
    const content = textsArray;
    textsArray = [];
    return content;
  }

  return processedChildren;
}

/**
 * Processes text nodes.
 * @param {string} value the node's text content
 * @returns {undefined}
 */
function processText(value) {
  textsArray.push(schema.text(value, activeMarks));
  return;
}

/**
 * Processes block nodes.
 * @param {object} nodeModel the nodeModel for this node type via nodeModelGetters
 * @param {array} children the node's child nodes
 * @return {Node} a ProseMirror node
 */
function processBlock({ pmType, attrs, content, defaultContent = null, hasText, canContainPlugins }, children) {
  // Plugins are just text shortcodes, so they're rendered as a text node within
  // a paragraph node in the MDAST. We use a regex to determine if the text
  // represents a plugin, so for performance reasons we only test text nodes that
  // are the only child of a node that can contain plugins. Currently, only
  // paragraphs may contain plugins.
  //
  // Additionally, images are handled via plugin. Because images already have a
  // markdown pattern, they're represented as 'image' type in the MDAST. We
  // check for those here, too.
  if (canContainPlugins && children.length === 1 && ['text', 'image'].includes(children[0].type)) {
    const processedPlugin = processPlugin(children[0]);
    if (processedPlugin) {
      return processedPlugin;
    }
  }

  const nodeContent = content || (isEmpty(children) ? defaultContent : getBlockContent(children, hasText));
  return schema.node(pmType, attrs, nodeContent);
}

/**
 * Processes inline nodes.
 * @param {object} nodeModel the nodeModel for this node type via nodeModelGetters
 * @param {array} children the node's child nodes
 * @return {undefined}
 */
function processInline({ pmType, attrs }, children, value) {
  const mark = schema.marks[pmType].create(attrs);
  activeMarks = mark.addToSet(activeMarks);

  if (isEmpty(children)) {
    textsArray.push(schema.text(value, activeMarks));
  } else {
    children.forEach(childNode => transform(childNode));
  }

  activeMarks = mark.removeFromSet(activeMarks);
  return;
}

/**
 * Processes plugins, which are represented as user-defined text shortcodes.
 *
 * The built in image plugin is handled differently because it overrides
 * remark/rehype's handling of a recognized markdown/html entity. Ideally, would
 * stop remark from parsing images at all, so that no special logic would be
 * required, but overriding this way would require a plugin to indicate what
 * entity it's overriding.
 *
 * @param {object} a remark node representing a user defined plugin
 * @return {Node} a ProseMirror Node
 */
function processPlugin({ type, value, alt, url }) {
  const isImage = type === 'image';
  const plugin = isImage ? plugins.get('image') : plugins.find(plugin => plugin.get('pattern').test(value));
  if (plugin) {
    const matches = isImage ? [ , alt, url ] : value.match(plugin.get('pattern'));
    const nodeType = schema.nodes[`plugin_${plugin.get('id')}`];
    const data = plugin.get('fromBlock').call(plugin, matches);
    return nodeType.create(data);
  }
}

/**
 * Uses unified to parse markdown and apply plugins.
 * @param {string} src raw markdown
 * @returns {Node} a ProseMirror Node
 */
function parser(src) {
  const result = unified()
    .use(markdown, { commonmark: true, footnotes: true, pedantic: true })
    .parse(src);

  return unified()
    .use(markdownToProseMirror)
    .runSync(result);
}

/**
 * Gets the parser and makes schema and plugins available at top scope.
 * @param {Schema} s a ProseMirror schema
 * @param {Map} p Immutable Map of registered plugins
 */
function parserGetter(s, p) {
  schema = s;
  plugins = p;
  return parser;
}

export default parserGetter;
