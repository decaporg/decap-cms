import isHotkey from 'is-hotkey';

const Hotkey = (key, fn) => {
  return {
    onKeyDown(event, editor, next) {
      if (!isHotkey(`mod+${key}`, event)) {
        return next();
      }
      event.preventDefault();
      editor.command(fn);
    },
  };
};

export default Hotkey;
