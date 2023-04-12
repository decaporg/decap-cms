import unwrapIfCursorAtStart from '../transforms/unwrapIfCursorAtStart';
import isCursorAtStartOfNonEmptyHeading from '../locations/isCursorAtStartOfNonEmptyHeading';

function keyDownBackspace(editor) {
  if (!editor.selection) return;

  if (isCursorAtStartOfNonEmptyHeading(editor)) {
    console.log('cursor at start of non empty heading')
    return;
  }

  return unwrapIfCursorAtStart(editor, true);
}

export default keyDownBackspace;
