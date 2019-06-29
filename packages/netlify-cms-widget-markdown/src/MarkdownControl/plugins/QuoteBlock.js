import isHotkey from 'is-hotkey';

/**
 * TODO: highlight a couple list items and hit the quote button. doesn't work.
 */
const QuoteBlock = ({ type, defaultType }) => ({
  commands: {
    /**
     * Quotes can contain other blocks, even other quotes. If a selection contains quotes, they
     * shouldn't be impacted. The selection's immediate parent should be checked - if it's a
     * quote, unwrap the quote (as within are only blocks), and if it's not, wrap all selected
     * blocks into a quote. Make sure text is wrapped into paragraphs.
     */
    toggleQuoteBlock(editor) {
      const topBlocks = editor.value.document.getRootBlocksAtRange(editor.value.selection);
      const firstBlockKey = topBlocks.first().key;
      const lastBlockKey = topBlocks.last().key;
      const ancestor = editor.value.document.getCommonAncestor(firstBlockKey, lastBlockKey);
      if (ancestor.type === type) {
        editor.unwrapBlock(type);
      } else {
        editor.wrapBlock(type);
      }
    },
  },
  onKeyDown(event, editor, next) {
    if (isHotkey('enter', event)) {
      if (editor.value.selection.isExpanded) {
        return editor.delete();
      }

      return next();
    } else if (isHotkey('backspace', event)) {
      const { selection, startBlock, document: doc } = editor.value;
      const parent = doc.getParent(startBlock.key);
      const isQuote = parent.type === type;
      if (!isQuote) {
        return next();
      }
      if (selection.isExpanded) {
        return editor.delete();
      }
      if (!selection.start.isAtStartOfNode(startBlock)) {
        return next();
      }
      const previousParentSibling = doc.getPreviousSibling(parent.key);
      if (previousParentSibling && previousParentSibling.type === type) {
        return editor.mergeNodeByKey(parent.key);
      }

      if (startBlock.type === defaultType && doc.getParent(startBlock.key).type === type) {
        return editor.unwrapNodeByKey(startBlock.key);
      }
      return next();
    }
    return next();
  },
});

export default QuoteBlock;
