/**
 * Images must be parsed as shortcodes for asset proxying. This plugin converts
 * MDAST image nodes back to text to allow shortcode pattern matching.
 */
export default function remarkImagesToText() {
  return transform;

  function transform(node) {
    const children = node.children ? node.children.map(transform) : node.children;
    if (node.type === 'image') {
      const alt = node.alt || '';
      const url = node.url || '';
      const title = node.title ? ` "${node.title}"` : '';
      return { type: 'text', value: `![${alt}](${url}${title})` };
    }
    return { ...node, children };
  }
}
