import { Editor } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function isCursorAtEndOfParagraph(editor) {
  const { selection } = editor;
  if (!selection) return false;

  const paragraph = Editor.above(editor, lowestMatchedAncestor(editor, 'paragraph'));

  return !!paragraph && Editor.isEnd(editor, editor.selection.focus, paragraph[1]);
}

export default isCursorAtEndOfParagraph;
