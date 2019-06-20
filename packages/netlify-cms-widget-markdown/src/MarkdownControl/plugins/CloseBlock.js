import isHotkey from 'is-hotkey';
import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const CloseBlock = () => ({
  onKeyDown(event, editor, next) {
    const { selection, startBlock } = editor.value;
    const isBackspace = isHotkey('backspace', event);
    if (!isBackspace) {
      return next();
    }
    if (selection.isExpanded) {
      return editor.delete();
    }
    if (!selection.start.isAtStartOfNode(startBlock) || startBlock.text.length > 0) {
      return next();
    }
    if (startBlock.type !== SLATE_DEFAULT_BLOCK_TYPE) {
      return editor.setBlocks(SLATE_DEFAULT_BLOCK_TYPE);
    }
    return next();
  },
});

export default CloseBlock;
