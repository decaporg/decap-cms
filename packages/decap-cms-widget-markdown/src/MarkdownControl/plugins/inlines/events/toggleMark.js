import { Editor } from 'slate';

import isMarkActive from '../locations/isMarkActive';

function toggleMark(editor, format) {
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

export default toggleMark;
