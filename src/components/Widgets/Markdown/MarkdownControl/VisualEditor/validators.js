import { Block, Text } from 'slate';

/**
 * Validation functions are used to validate the editor state each time it
 * changes, to ensure it is never rendered in an undesirable state.
 */
export function validateNode(node) {
  /**
   * Validation of the document itself.
   */
  if (node.kind === 'document') {
    const doc = node;
    /**
     * If the editor is ever in an empty state, insert an empty
     * paragraph block.
     */
    const hasBlocks = !doc.getBlocks().isEmpty();
    if (!hasBlocks) {
      return change => {
        const block = Block.create({
          type: 'paragraph',
          nodes: [Text.create('')],
        });
        const { key } = change.value.document;
        return change.insertNodeByKey(key, 0, block).focus();
      };
    }

    /**
     * Ensure that shortcodes are children of the root node.
     */
    const nestedShortcode = doc.findDescendant(descendant => {
      const { type, key } = descendant;
      return type === 'shortcode' && doc.getParent(key).key !== doc.key;
    });
    if (nestedShortcode) {
      const unwrapShortcode = change => {
        const key = nestedShortcode.key;
        const newDoc = change.value.document;
        const newParent = newDoc.getParent(key);
        const docIsParent = newParent.key === newDoc.key;
        const newParentParent = newDoc.getParent(newParent.key);
        const docIsParentParent = newParentParent && newParentParent.key === newDoc.key;
        if (docIsParent) {
          return change;
        }
        /**
         * Normalization happens by default, and causes all validation to
         * restart with the result of a change upon execution. This unwrap loop
         * could temporarily place a shortcode node in conflict with an outside
         * plugin's schema, resulting in an infinite loop. To ensure against
         * this, we turn off normalization until the last change.
         */
        change.unwrapNodeByKey(nestedShortcode.key, { normalize: docIsParentParent });
      };
      return unwrapShortcode;
    }

    /**
     * Ensure that trailing shortcodes are followed by an empty paragraph.
     */
    const trailingShortcode = doc.findDescendant(descendant => {
      const { type, key } = descendant;
      return type === 'shortcode' && doc.getBlocks().last().key === key;
    });
    if (trailingShortcode) {
      return change => {
        const text = Text.create('');
        const block = Block.create({ type: 'paragraph', nodes: [ text ] });
        return change.insertNodeByKey(doc.key, doc.get('nodes').size, block);
      };
    }
  }


  /**
   * Ensure that code blocks contain no marks.
   */
  if (node.type === 'code') {
    const invalidChild = node.getTexts().find(text => !text.getMarks().isEmpty());
    if (invalidChild) {
      return change => (
        invalidChild.getMarks().forEach(mark => (
          change.removeMarkByKey(invalidChild.key, 0, invalidChild.get('characters').size, mark)
        ))
      );
    }
  }
};
