import find from 'lodash/find';
import findLast from 'lodash/findLast';
import startsWith from 'lodash/startsWith';
import endsWith from 'lodash/endsWith';
import trimStart from 'lodash/trimStart';
import trimEnd from 'lodash/trimEnd';
import flatMap from 'lodash/flatMap';
import u from 'unist-builder';
import toString from 'mdast-util-to-string';

/**
 * Convert leading and trailing spaces in a link to single spaces outside of the
 * link. MDASTs derived from pasted Google Docs HTML require this treatment.
 *
 * Note that, because we're potentially replacing characters in a link node's
 * children with character's in a link node's siblings, we have to operate on a
 * parent (link) node and its children at once, rather than just processing
 * children one at a time.
 */
export default function remarkPaddedLinks() {
  function transform(node) {
    /**
     * Because we're operating on link nodes and their children at once, we can
     * exit if the current node has no children.
     */
    if (!node.children) return node;

    /**
     * Process a node's children if any of them are links. If a node is a link
     * with leading or trailing spaces, we'll get back an array of nodes instead
     * of a single node, so we use `flatMap` to keep those nodes as siblings
     * with the other children.
     *
     * If performance improvements are found desirable, we could change this to
     * only pass in the link nodes instead of the entire array of children, but
     * this seems unlikely to produce a noticeable perf gain.
     */
    const hasLinkChild = node.children.some(child => child.type === 'link');
    const processedChildren = hasLinkChild
      ? flatMap(node.children, transformChildren)
      : node.children;

    /**
     * Run all children through the transform recursively.
     */
    const children = processedChildren.map(transform);

    return { ...node, children };
  }

  function transformChildren(node) {
    if (node.type !== 'link') return node;

    /**
     * Get the node's complete string value, check for leading and trailing
     * whitespace, and get nodes from each edge where whitespace is found.
     */
    const text = toString(node);
    const leadingWhitespaceNode = startsWith(text, ' ') && getEdgeTextChild(node);
    const trailingWhitespaceNode = endsWith(text, ' ') && getEdgeTextChild(node, true);

    if (!leadingWhitespaceNode && !trailingWhitespaceNode) return node;

    /**
     * Trim the edge nodes in place. Unified handles everything in a mutable
     * fashion, so it's often simpler to do the same when working with Unified
     * ASTs.
     */
    if (leadingWhitespaceNode) {
      leadingWhitespaceNode.value = trimStart(leadingWhitespaceNode.value);
    }

    if (trailingWhitespaceNode) {
      trailingWhitespaceNode.value = trimEnd(trailingWhitespaceNode.value);
    }

    /**
     * Create an array of nodes. The first and last child will either be `false`
     * or a text node. We filter out the false values before returning.
     */
    const nodes = [
      leadingWhitespaceNode && u('text', ' '),
      node,
      trailingWhitespaceNode && u('text', ' '),
    ];

    return nodes.filter(val => val);
  }

  /**
   * Get the first or last non-blank text child of a node, regardless of
   * nesting. If `end` is truthy, get the last node, otherwise first.
   */
  function getEdgeTextChild(node, end) {
    /**
     * This was changed from a ternary to a long form if due to issues with istanbul's instrumentation and babel's code
     * generation.
     * TODO: watch https://github.com/istanbuljs/babel-plugin-istanbul/issues/95
     * when it is resolved then revert to ```const findFn = end ? findLast : find;```
     */
    let findFn;
    if (end) {
      findFn = findLast;
    } else {
      findFn = find;
    }

    let edgeChildWithValue;
    setEdgeChildWithValue(node);
    return edgeChildWithValue;

    /**
     * searchChildren checks a node and all of it's children deeply to find a
     * non-blank text value. When the text node is found, we set it in an outside
     * variable, as it may be deep in the tree and therefore wouldn't be returned
     * by `find`/`findLast`.
     */
    function setEdgeChildWithValue(child) {
      if (!edgeChildWithValue && child.value) {
        edgeChildWithValue = child;
      }
      findFn(child.children, setEdgeChildWithValue);
    }
  }
  return transform;
}
