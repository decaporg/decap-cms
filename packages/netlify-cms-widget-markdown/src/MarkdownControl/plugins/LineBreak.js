import isHotkey from 'is-hotkey';

function LineBreak() {
  return {
    onKeyDown(event, editor, next) {
      const isShiftEnter = isHotkey('shift+enter', event);
      if (!isShiftEnter) {
        return next();
      }
      return editor
        .insertInline('break')
        .insertText('')
        .moveToStartOfNextText();
    },
  };
}

export default LineBreak;
