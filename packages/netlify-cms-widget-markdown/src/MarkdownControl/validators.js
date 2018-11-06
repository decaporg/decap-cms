import { Block, Text } from 'slate';

/**
 * Validation functions are used to validate the editor state each time it
 * changes, to ensure it is never rendered in an undesirable state.
 */
export function validateNode(node) {
  /**
   * Validation of the document itself.
   */
  if (node.object === 'document') {
    const doc = node;
    /**
     * If the editor is ever in an empty state, insert an empty
     * paragraph block.
     */
    const hasBlocks = !doc.getBlocks().isEmpty();
    if (!hasBlocks) {
      return editor => {
        const block = Block.create({
          type: 'paragraph',
          nodes: [Text.create('')],
        });
        const { key } = editor.value.document;
        return editor.insertNodeByKey(key, 0, block).focus();
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
      const unwrapShortcode = editor => {
        const key = nestedShortcode.key;
        const newDoc = editor.value.document;
        const newParent = newDoc.getParent(key);
        const docIsParent = newParent.key === newDoc.key;
        const newParentParent = newDoc.getParent(newParent.key);
        const docIsParentParent = newParentParent && newParentParent.key === newDoc.key;
        if (docIsParent) {
          return editor;
        }
        /**
         * Normalization happens by default, and causes all validation to
         * restart with the result of a change upon execution. This unwrap loop
         * could temporarily place a shortcode node in conflict with an outside
         * plugin's schema, resulting in an infinite loop. To ensure against
         * this, we turn off normalization until the last change.
         */
        const unwrapNestedShortcode = editor => editor.unwrapNodeByKey(nestedShortcode.key);
        if (docIsParentParent) {
          unwrapNestedShortcode(editor)
        } else {
          editor.withoutNormalizing(() => unwrapNestedShortcode(editor));
        }
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
      return editor => {
        const text = Text.create('');
        const block = Block.create({ type: 'paragraph', nodes: [text] });
        return editor.insertNodeByKey(doc.key, doc.get('nodes').size, block);
      };
    }
  }

  /**
   * Ensure that code blocks contain no marks.
   */
  if (node.type === 'code') {
    const invalidChild = node.getTexts().find(text => !text.getMarks().isEmpty());
    if (invalidChild) {
      return editor =>
        invalidChild
          .getMarks()
          .forEach(mark =>
            editor.removeMarkByKey(invalidChild.key, 0, invalidChild.get('characters').size, mark),
          );
    }
  }
}
