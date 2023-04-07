
import isHotkey from 'is-hotkey';

import keyDownEnter from './keyDownEnter';
import keyDownTab from './keyDownTab';
import keyDownShiftTab from './keyDownShiftTab';

function keyDown(event, editor) {
  if (!editor.isListItem()) return;

  if (isHotkey('enter', event)) {
    event.preventDefault();
    return keyDownEnter(editor);
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

export default keyDown
