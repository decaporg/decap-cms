import isHotkey from 'is-hotkey';

export const HOT_KEY_MAP = {
  bold: 'mod+b',
  code: 'mod+shift+c',
  italic: 'mod+i',
  strikethrough: 'mod+shift+s',
  'heading-one': 'mod+1',
  'heading-two': 'mod+2',
  'heading-three': 'mod+3',
  'heading-four': 'mod+4',
  'heading-five': 'mod+5',
  'heading-six': 'mod+6',
  link: 'mod+k',
};

const Hotkey = (key, fn) => {
  return {
    onKeyDown(event, editor, next) {
      if (!isHotkey(key, event)) {
        return next();
      }
      event.preventDefault();
      editor.command(fn);
    },
  };
};

export default Hotkey;
