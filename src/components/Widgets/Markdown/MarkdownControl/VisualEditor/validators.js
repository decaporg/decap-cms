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
        const { key } = change.state.document;
        return change.insertNodeByKey(key, 0, block).focus();
      };
    }

    /**
     * Ensure that shortcodes are children of the root node.
     */
    const nestedShortcode = node.findDescendant(descendant => {
      const { type, key } = descendant;
      return type === 'shortcode' && node.getParent(key).key !== node.key;
    });
    if (nestedShortcode) {
      return change => change.unwrapNodeByKey(node.key);
    }

    /**
     * Ensure that trailing shortcodes are followed by an empty paragraph.
     */
    const trailingShortcode = node.findDescendant(descendant => {
      const { type, key } = descendant;
      return type === 'shortcode' && node.getBlocks().last().key === key;
    });
    if (trailingShortcode) {
      return change => {
        const text = Text.create('');
        const block = Block.create({ type: 'paragraph', nodes: [ text ] });
        return change.insertNodeByKey(node.key, node.get('nodes').size, block);
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
