import u from 'unist-builder';

/**
 * Ensure that top level 'html' type nodes are wrapped in paragraphs. Html nodes
 * are used for text nodes that we don't want Remark or Rehype to parse.
 */
export default function remarkWrapHtml() {

  function transform(tree) {
    tree.children = tree.children.map(node => {
      if (node.type === 'html') {
        return u('paragraph', [node]);
      }
      return node;
    });

    return tree;
  }

  return transform;
}
