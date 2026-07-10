import isHotkey from 'is-hotkey';
import { Editor, Transforms } from 'slate';

import keyDownEnter from './keyDownEnter';
import keyDownBackspace from './keyDownBackspace';
import isCursorInNonDefaultBlock from '../locations/isCursorInNonDefaultBlock';
import toggleBlock from './toggleBlock';
import isCursorCollapsedAfterSoftBreak from '../locations/isCursorCollapsedAfterSoftBreak';

const HEADING_HOTKEYS = {
  'mod+1': 'heading-one',
  'mod+2': 'heading-two',
  'mod+3': 'heading-three',
  'mod+4': 'heading-four',
  'mod+5': 'heading-five',
  'mod+6': 'heading-six',
};

function keyDown(event, editor) {
  if (!editor.selection) return;

  for (const hotkey in HEADING_HOTKEYS) {
    if (isHotkey(hotkey, event)) {
      toggleBlock(editor, HEADING_HOTKEYS[hotkey]);
      event.preventDefault();
      return false;
    }
  }

  if (isHotkey('backspace', event) && isCursorCollapsedAfterSoftBreak(editor)) {
    const [, path] = Editor.previous(editor);
    Transforms.removeNodes(editor, { at: path });
    event.preventDefault();
    return false;
  }

  if (!isCursorInNonDefaultBlock(editor)) return;

  if (isHotkey('enter', event)) {
    const eventIntercepted = keyDownEnter(editor);
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
