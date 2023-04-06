
import isHotkey from 'is-hotkey';

import keyDownEnter from './keyDownEnter';
import keyDownTab from './keyDownTab';

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
}

export default keyDown
