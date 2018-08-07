import mdastToString from 'mdast-util-to-string';

/**
 * Removes break nodes that are at the end of a block.
 *
 * When a trailing double space or backslash is encountered at the end of a
 * markdown block, Remark will interpret the character(s) literally, as only
 * break entities followed by text qualify as breaks. A manually created MDAST,
 * however, may have such entities, and users of visual editors shouldn't see
 * these artifacts in resulting markdown.
 */
export default function remarkStripTrailingBreaks() {
  const transform = node => {
    if (node.children) {
      node.children = node.children
        .map((child, idx, children) => {
          /**
           * Only touch break nodes. Convert all subsequent nodes to their text
           * value and exclude the break node if no non-whitespace characters
           * are found.
           */
          if (child.type === 'break') {
            const subsequentNodes = children.slice(idx + 1);

            /**
             * Create a small MDAST so that mdastToString can process all
             * siblings as children of one node rather than making multiple
             * calls.
             */
            const fragment = { type: 'root', children: subsequentNodes };
            const subsequentText = mdastToString(fragment);
            return subsequentText.trim() ? child : null;
          }

          /**
           * Always return the child if not a break.
           */
          return child;
        })

        /**
         * Because some break nodes may be excluded, we filter out the resulting
         * null values.
         */
        .filter(child => child)

        /**
         * Recurse through the MDAST by transforming each individual child node.
         */
        .map(transform);
    }
    return node;
  };
  return transform;
}
