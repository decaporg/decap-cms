import isHotkey from 'is-hotkey';

import keyDownEnter from './keyDownEnter';
import keyDownBackspace from './keyDownBackspace';
import isCursorInNonDefaultBlock from '../locations/isCursorInNonDefaultBlock';

function keyDown(event, editor) {
  if (!editor.selection) return;
  if (!isCursorInNonDefaultBlock(editor)) return;

  if (isHotkey('enter', event)) {
    const eventIntercepted =  keyDownEnter(editor);
    if (eventIntercepted) {
      event.preventDefault();
      return false;
    }
  }

  if (isHotkey('backspace', event)) {
    const eventIntercepted = keyDownBackspace(editor);
    if (eventIntercepted) {
      event.preventDefault();
      return false;
    }
  }
}

export default keyDown;
