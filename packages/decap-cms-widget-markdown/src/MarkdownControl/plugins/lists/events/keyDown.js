import isHotkey from 'is-hotkey';

import keyDownEnter from './keyDownEnter';
import keyDownTab from './keyDownTab';
import keyDownShiftTab from './keyDownShiftTab';
import keyDownBackspace from './keyDownBackspace';

function keyDown(event, editor) {
  if (!editor.isListItem()) return;

  if (isHotkey('enter', event)) {
    event.preventDefault();
    keyDownEnter(editor);
    return false;
  }
  if (isHotkey('backspace', event)) {
    const eventIntercepted = keyDownBackspace(editor);
    if (eventIntercepted === false) {
      event.preventDefault();
      return false;
    }
    return;
  }
  if (isHotkey('tab', event)) {
    event.preventDefault();
    return keyDownTab(editor);
  }
  if (isHotkey('shift+tab', event)) {
    event.preventDefault();
    return keyDownShiftTab(editor);
  }
}

export default keyDown;
