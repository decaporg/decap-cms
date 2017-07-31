import { find, capitalize } from 'lodash';

/**
 * Remove empty nodes, including the top level parents of deeply nested empty nodes.
 */
export default function rehypeRemoveEmpty() {
  const isVoidElement = node => ['img', 'hr', 'br'].includes(node.tagName);
  const isNonEmptyLeaf = node => ['text', 'raw'].includes(node.type) && node.value;
  const isShortcode = node => node.properties && node.properties[`data${capitalize(shortcodeAttributePrefix)}`];
  const isNonEmptyNode =  node => {
    return isVoidElement(node)
      || isNonEmptyLeaf(node)
      || isShortcode(node)
      || find(node.children, isNonEmptyNode);
  };

  const transform = node => {
    if (isVoidElement(node) || isNonEmptyLeaf(node) || isShortcode(node)) {
      return node;
    }
    if (node.children) {
      node.children = node.children.reduce((acc, childNode) => {
        if (isVoidElement(childNode) || isNonEmptyLeaf(childNode) || isShortcode(node)) {
          return acc.concat(childNode);
        }
        return find(childNode.children, isNonEmptyNode) ? acc.concat(transform(childNode)) : acc;
      }, []);
    }
    return node;
  };
  return transform;
}
