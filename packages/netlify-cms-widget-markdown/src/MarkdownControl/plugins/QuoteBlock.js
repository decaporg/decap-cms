import isHotkey from 'is-hotkey';
import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const QuoteBlock = () => ({
  onKeyDown(event, editor, next) {
    const isBackspace = isHotkey('backspace', event);
    const { selection, startBlock, document: doc } = editor.value;
    if (!isBackspace) {
      return next();
    }
    if (selection.isExpanded) {
      return editor.delete();
    }
    if (!selection.start.isAtStartOfNode(startBlock)) {
      return next();
    }
    if (startBlock.type === SLATE_DEFAULT_BLOCK_TYPE && doc.getParent(startBlock.key).type === 'quote' ) {
      return editor.unwrapNodeByKey(startBlock.key);
    }
    return next();
  },
});

export default QuoteBlock;
