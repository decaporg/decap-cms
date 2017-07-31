/**
 * If the first child of a list item is a list, include it in the previous list
 * item. Otherwise it translates to markdown as having two bullets. When
 * rehype-remark processes a list and finds children that are not list items, it
 * wraps them in list items, which leads to the condition this plugin addresses.
 * Dropbox Paper currently outputs this kind of HTML, which is invalid. We have
 * a support issue open for it, and this plugin can potentially be removed when
 * that's resolved.
 */

export default function remarkNestedList() {
  const transform = node => {
    if (node.type === 'list' && node.children && node.children.length > 1) {
      node.children = node.children.reduce((acc, childNode, index) => {
        if (index && childNode.children && childNode.children[0].type === 'list') {
          acc[acc.length - 1].children.push(transform(childNode.children.shift()))
          if (childNode.children.length) {
            acc.push(transform(childNode));
          }
        } else {
          acc.push(transform(childNode));
        }
        return acc;
      }, []);
      return node;
    }
    if (node.children) {
      node.children = node.children.map(transform);
    }
    return node;
  };
  return transform;
}
