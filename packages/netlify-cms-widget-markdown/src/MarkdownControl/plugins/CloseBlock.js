import isHotkey from 'is-hotkey';

const CloseBlock = ({ defaultType }) => ({
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
    if (startBlock.type !== defaultType) {
      return editor.setBlocks(defaultType);
    }
    return next();
  },
});

export default CloseBlock;
