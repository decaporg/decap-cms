import isCursorInBlockType from '../locations/isCursorInBlockType';
import splitIntoParagraph from '../transforms/splitIntoParagraph';
import unwrapIfCursorAtStart from '../transforms/unwrapIfCursorAtStart';
import isCursorAtEndOfParagraph from '../locations/isCursorAtEndOfParagraph';

function keyDownEnter(editor) {
  if (!editor.selection) return;

  if (isCursorInBlockType(editor, 'heading', true)) {
    return handleHeading(editor);
  }

  return unwrapIfCursorAtStart(editor);
}

function handleHeading(editor) {
  if (isCursorAtEndOfParagraph(editor)) {
    // split into paragraph if cursor is at the end of heading
    splitIntoParagraph(editor);
    return true;
  }

  return;
}

export default keyDownEnter;
