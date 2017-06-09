import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

/**
 * A remark plugin for converting an MDAST to a ProseMirror tree.
 * @param {state} information to be shared across ProseMirror actions
 * @returns {function} a transformer function
 */
export default function markdownToProseMirror({ state }) {

  // The state object also contains `activeMarks` and `textsArray`, but we
  // may change those values from here to be shared across ProseMirror actions
  // (this plugin is run for each action), so we always access them directly
  // on the state object.
  const { schema, plugins } = state;

  return transform;

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
    const processor = get(nodeDef, 'block') ? processBlock : processInline;

    return nodeDef ? processor(nodeDef, node.children, node.value) : node;
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
      const content = state.textsArray;
      state.textsArray = [];
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
    state.textsArray.push(schema.text(value, state.activeMarks));
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
    state.activeMarks = mark.addToSet(state.activeMarks);

    if (isEmpty(children)) {
      state.textsArray.push(schema.text(value, state.activeMarks));
    } else {
      children.forEach(childNode => transform(childNode));
    }

    state.activeMarks = mark.removeFromSet(state.activeMarks);
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
}
