import { Editor } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function isCursorAtStartOfBlockType(editor, type) {
  const { selection } = editor;
  if (!selection) return false;

  const block = Editor.above(editor, lowestMatchedAncestor(editor, type));

  return !!block && Editor.isStart(editor, editor.selection.focus, block[1]);
}

export default isCursorAtStartOfBlockType;
