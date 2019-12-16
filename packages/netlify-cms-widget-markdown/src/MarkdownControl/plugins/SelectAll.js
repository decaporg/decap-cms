import isHotkey from 'is-hotkey';

const SelectAll = () => ({
  onKeyDown(event, editor, next) {
    const isModA = isHotkey('mod+a', event);
    if (!isModA) {
      return next();
    }
    event.preventDefault();
    return editor.moveToRangeOfDocument();
  },
});

export default SelectAll;
