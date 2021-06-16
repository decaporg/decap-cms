import isHotkey from 'is-hotkey';

import { SLATE_LIST_BLOCK_TYPES as listType } from '../../types';

function BreakToDefaultBlock({ defaultType }) {
  return {
    onKeyDown(event, editor, next) {
      const { selection, startBlock, blocks } = editor.value;
      const isEnter = isHotkey('enter', event);
      if (!isEnter) {
        return next();
      }
      const isListItem = blocks.some(node => node.type === listType.children);
      if (isListItem) {
        if (startBlock.text.length > 0) return next();
        return editor.setNodeByKey(startBlock.key, { type: defaultType });
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
