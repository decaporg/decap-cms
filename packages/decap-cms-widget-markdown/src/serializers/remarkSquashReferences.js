import without from 'lodash/without';
import flatten from 'lodash/flatten';
import { u } from 'unist-builder';
import mdastDefinitions from 'mdast-util-definitions';

/**
 * Raw markdown may contain image references or link references. Because there
 * is no way to maintain these references within the Slate AST, we convert image
 * and link references to standard images and links by putting their url's
 * inline. The definitions are then removed from the document.
 *
 * For example, the following markdown:
 *
 * ```
 * ![alpha][bravo]
 *
 * [bravo]: http://example.com/example.jpg
 * ```
 *
 * Yields:
 *
 * ```
 * ![alpha](http://example.com/example.jpg)
 * ```
 *
 */
export default function remarkSquashReferences() {
  return function transformer(tree /*, file */) {
    const getDefinition = mdastDefinitions(tree);


    function transform(getDefinition, node) {
      if (!node) return null;
      /**
       * Bind the `getDefinition` function to `transform` and recursively map all
       * nodes.
       */
      const boundTransform = transform.bind(null, getDefinition);
      const children = node.children ? node.children.map(boundTransform) : node.children;

      /**
       * Combine reference and definition nodes into standard image and link
       * nodes.
       */
      if (['imageReference', 'linkReference'].includes(node.type)) {
        const type = node.type === 'imageReference' ? 'image' : 'link';
        const definition = getDefinition(node.identifier);

        // Extract alt text for imageReference in remark-parse v9
        let alt = undefined;
        if (node.type === 'imageReference') {
          // alt text is a child text node
          if (node.children && node.children.length > 0) {
            alt = node.children.map(child => child.value).join('');
          }
        }

        if (definition) {
          const { title, url } = definition;
          return u(type, { title, url, alt }, children);
        }

        const pre = u('text', node.type === 'imageReference' ? '![' : '[');
        const post = u('text', ']');
        const nodes = children || [u('text', alt)];
        return [pre, ...nodes, post];
      }

      /**
       * Remove definition nodes and filter the resulting null values from the
       * filtered children array.
       */
      if (node.type === 'definition') {
        return null;
      }

      const filteredChildren = without(children, null);

      return { ...node, children: flatten(filteredChildren) };
    }
    const newTree = transform(getDefinition, tree);
    Object.assign(tree, newTree);
  };
}
