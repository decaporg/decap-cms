import isHotkey from 'is-hotkey';
import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const BreakToDefaultBlock = () => ({
  onKeyDown(event, editor, next) {
    const { selection, startBlock } = editor.value;
    const isEnter = isHotkey('enter', event);
    if (!isEnter) {
      return next();
    }
    if (selection.isExpanded) {
      editor.delete();
      return next();
    }
    if (selection.start.isAtEndOfNode(startBlock) && startBlock.type !== SLATE_DEFAULT_BLOCK_TYPE) {
      return editor.insertBlock(SLATE_DEFAULT_BLOCK_TYPE);
    }
    return next();
  },
});

export default BreakToDefaultBlock;
