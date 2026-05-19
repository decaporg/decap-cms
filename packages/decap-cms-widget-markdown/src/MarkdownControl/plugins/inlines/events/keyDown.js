import isHotkey from 'is-hotkey';

import toggleMark from './toggleMark';
import keyDownShiftEnter from './keyDownShiftEnter';
import toggleLink from './toggleLink';

const MARK_HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+shift+s': 'delete',
  'mod+shift+c': 'code',
};

function keyDown(event, editor) {
  if (!editor.selection) return;

  for (const hotkey in MARK_HOTKEYS) {
    if (isHotkey(hotkey, event)) {
      toggleMark(editor, MARK_HOTKEYS[hotkey]);
      event.preventDefault();
      return false;
    }
  }

  if (isHotkey('mod+k', event)) {
    event.preventDefault();
    return toggleLink(editor);
  }

  if (isHotkey('shift+enter', event)) {
    event.preventDefault();
    return keyDownShiftEnter(editor);
  }
}

export default keyDown;
