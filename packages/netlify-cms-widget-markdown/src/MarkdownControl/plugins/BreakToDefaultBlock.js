import isHotkey from 'is-hotkey';

function BreakToDefaultBlock({ defaultType }) {
  return {
    onKeyDown(event, editor, next) {
      const { selection, startBlock, document } = editor.value;
      const isEnter = isHotkey('enter', event);
      if (!isEnter) {
        return next();
      }
      if (selection.isExpanded) {
        editor.delete();
        return next();
      }
      /** If the block that receives the Enter key is a child of a list item block, we'll
       * skip this plugin and create a new list item block underneath instead.
       */
      const parent = document.getParent(startBlock.key);
      if (parent.type === 'list-item') return next();
      if (selection.start.isAtEndOfNode(startBlock) && startBlock.type !== defaultType) {
        return editor.insertBlock(defaultType);
      }
      return next();
    },
  };
}

export default BreakToDefaultBlock;
