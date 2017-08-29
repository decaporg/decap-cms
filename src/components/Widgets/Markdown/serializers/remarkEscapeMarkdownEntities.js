/**
 * A Remark plugin for escaping markdown entities.
 *
 * When markdown entities are entered in raw markdown, they don't appear as
 * characters in the resulting AST; for example, dashes surrounding a piece of
 * text cause the text to be inserted in a special node type, but the asterisks
 * themselves aren't present as text. Therefore, we generally don't expect to
 * encounter markdown characters in text nodes.
 *
 * However, the CMS visual editor does not interpret markdown characters, and
 * users will expect these characters to be represented literally. In that case,
 * we need to escape them, otherwise they'll be interpreted during
 * stringification.
 */
export default function remarkEscapeMarkdownEntities() {
  /**
   * Escape all occurrences of '[', '*', '_', '`', and '~'.
   */
  function escapeCommonChars(text) {
    return text.replace(/[\[*_`~]/g, '\\$&');
  }

  /**
   * Runs escapeCommonChars, and also escapes '#' and '-' when found at the
   * beginning of any node's first child node.
   */
  function escapeAllChars(text) {
    const partiallyEscapedMarkdown = escapeCommonChars(text);
    return partiallyEscapedMarkdown.replace(/^\s*([#-])/, '$`\\$1');
  }

  const transform = (node, index) => {
    const children = node.children && node.children.map(transform);

    /**
     * Escape characters in text and html nodes only. We store a lot of normal
     * text in html nodes to keep Remark from escaping html entities.
     */
    if (['text', 'html'].includes(node.type)) {

      /**
       * Escape all characters if this is the first child node, otherwise only
       * common characters.
       */
      const value = index === 0 ? escapeAllChars(node.value) : escapeCommonChars(node.value);
      return { ...node, value, children };
    }

    /**
     * Always return nodes with recursively mapped children.
     */
    return {...node, children };
  };

  return transform;
}
