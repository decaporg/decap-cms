import isHotkey from 'is-hotkey';

function BreakToDefaultBlock({ defaultType }) {
  return {
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
      if (selection.start.isAtEndOfNode(startBlock) && startBlock.type !== defaultType) {
        return editor.insertBlock(defaultType);
      }
      return next();
    },
  };
}

export default BreakToDefaultBlock;
