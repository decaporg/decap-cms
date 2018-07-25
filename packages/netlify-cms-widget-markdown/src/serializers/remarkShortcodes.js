import { map, every } from 'lodash';
import u from 'unist-builder';
import mdastToString from 'mdast-util-to-string';

/**
 * Parse shortcodes from an MDAST.
 *
 * Shortcodes are plain text, and must be the lone content of a paragraph. The
 * paragraph must also be a direct child of the root node. When a shortcode is
 * found, we just need to add data to the node so the shortcode can be
 * identified and processed when serializing to a new format. The paragraph
 * containing the node is also recreated to ensure normalization.
 */
export default function remarkShortcodes({ plugins }) {
  return transform;

  /**
   * Map over children of the root node and convert any found shortcode nodes.
   */
  function transform(root) {
    const transformedChildren = map(root.children, processShortcodes);
    return { ...root, children: transformedChildren };
  }

  /**
   * Mapping function to transform nodes that contain shortcodes.
   */
  function processShortcodes(node) {
    /**
     * If the node is not eligible to contain a shortcode, return the original
     * node unchanged.
     */
    if (!nodeMayContainShortcode(node)) return node;

    /**
     * Combine the text values of all children to a single string, check the
     * string for a shortcode pattern match, and validate the match.
     */
    const text = mdastToString(node).trim();
    const { plugin, match } = matchTextToPlugin(text);
    const matchIsValid = validateMatch(text, match);

    /**
     * If a valid match is found, return a new node with shortcode data
     * included. Otherwise, return the original node.
     */
    return matchIsValid ? createShortcodeNode(text, plugin, match) : node;
  };

  /**
   * Ensure that the node and it's children are acceptable types to contain
   * shortcodes. Currently, only a paragraph containing text and/or html nodes
   * may contain shortcodes.
   */
  function nodeMayContainShortcode(node) {
    const validNodeTypes = ['paragraph'];
    const validChildTypes = ['text', 'html'];

    if (validNodeTypes.includes(node.type)) {
      return every(node.children, child => {
        return validChildTypes.includes(child.type);
      });
    }
  }

  /**
   * Return the plugin and RegExp.match result from the first plugin with a
   * pattern that matches the given text.
   */
  function matchTextToPlugin(text) {
    let match;
    const plugin = plugins.find(p => {
      match = text.match(p.pattern);
      return !!match;
    });
    return { plugin, match };
  }

  /**
   * A match is only valid if it takes up the entire paragraph.
   */
  function validateMatch(text, match) {
    return match && match[0].length === text.length;
  }

  /**
   * Create a new node with shortcode data included. Use an 'html' node instead
   * of a 'text' node as the child to ensure the node content is not parsed by
   * Remark or Rehype. Include the child as an array because an MDAST paragraph
   * node must have it's children in an array.
   */
  function createShortcodeNode(text, plugin, match) {
    const shortcode = plugin.id;
    const shortcodeData = plugin.fromBlock(match);
    const data = { shortcode, shortcodeData };
    const textNode = u('html', text);
    return u('paragraph', { data }, [textNode]);
  }
}
