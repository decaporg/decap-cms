import concat from 'lodash/concat';
import last from 'lodash/last';
import nth from 'lodash/nth';
import isEmpty from 'lodash/isEmpty';
import visitParents from 'unist-util-visit-parents';

/**
 * remarkUnwrapInvalidNest
 *
 * Some MDAST node types can only be nested within specific node types - for
 * example, a paragraph can't be nested within another paragraph, and a heading
 * can't be nested in a "strong" type node. This kind of invalid MDAST can be
 * generated by rehype-remark from invalid HTML.
 *
 * This plugin finds instances of invalid nesting, and unwraps the invalidly
 * nested nodes as far up the parental line as necessary, splitting parent nodes
 * along the way. The resulting node has no invalidly nested nodes, and all
 * validly nested nodes retain their ancestry. Nodes that are emptied as a
 * result of unnesting nodes are removed from the tree.
 */
export default function remarkUnwrapInvalidNest() {
  return transform;

  function transform(tree) {
    const invalidNest = findInvalidNest(tree);

    if (!invalidNest) return tree;

    splitTreeAtNest(tree, invalidNest);

    return transform(tree);
  }

  /**
   * visitParents uses unist-util-visit-parent to check every node in the
   * tree while having access to every ancestor of the node. This is ideal
   * for determining whether a block node has an ancestor that should not
   * contain a block node. Note that it operates in a mutable fashion.
   */
  function findInvalidNest(tree) {
    /**
     * Node types that are considered "blocks".
     */
    const blocks = ['paragraph', 'heading', 'code', 'blockquote', 'list', 'table', 'thematicBreak'];

    /**
     * Node types that can contain "block" nodes as direct children. We check
     */
    const canContainBlocks = ['root', 'blockquote', 'listItem', 'tableCell'];

    let invalidNest;

    visitParents(tree, (node, parents) => {
      const parentType = !isEmpty(parents) && last(parents).type;
      const isInvalidNest = blocks.includes(node.type) && !canContainBlocks.includes(parentType);

      if (isInvalidNest) {
        invalidNest = concat(parents, node);
        return false;
      }
    });

    return invalidNest;
  }

  function splitTreeAtNest(tree, nest) {
    const grandparent = nth(nest, -3) || tree;
    const parent = nth(nest, -2);
    const node = last(nest);

    const splitIndex = grandparent.children.indexOf(parent);
    const splitChildren = grandparent.children;
    const splitChildIndex = parent.children.indexOf(node);

    const childrenBefore = parent.children.slice(0, splitChildIndex);
    const childrenAfter = parent.children.slice(splitChildIndex + 1);
    const nodeBefore = !isEmpty(childrenBefore) && { ...parent, children: childrenBefore };
    const nodeAfter = !isEmpty(childrenAfter) && { ...parent, children: childrenAfter };

    const childrenToInsert = [nodeBefore, node, nodeAfter].filter(val => !isEmpty(val));
    const beforeChildren = splitChildren.slice(0, splitIndex);
    const afterChildren = splitChildren.slice(splitIndex + 1);
    const newChildren = concat(beforeChildren, childrenToInsert, afterChildren);
    grandparent.children = newChildren;
  }
}
