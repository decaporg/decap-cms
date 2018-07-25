/**
 * Images must be parsed as shortcodes for asset proxying. This plugin converts
 * MDAST image nodes back to text to allow shortcode pattern matching. Note that
 * this transformation only occurs for images that are the sole child of a top
 * level paragraph - any other image is left alone and treated as an inline
 * image.
 */
export default function remarkImagesToText() {
  return transform;

  function transform(node) {
    const children = node.children.map(child => {
      if (
        child.type === 'paragraph'
        && child.children.length === 1
        && child.children[0].type === 'image'
      ) {
        const { alt = '', url = '', title = '' } = child.children[0];
        const value = `![${alt}](${url}${title ? ' title' : ''})`;
        child.children = [{ type: 'text', value }];
      }
      return child;
    });
    return { ...node, children };
  }
}
