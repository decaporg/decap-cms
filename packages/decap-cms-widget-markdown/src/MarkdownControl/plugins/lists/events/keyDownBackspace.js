import { Range } from 'slate';

import isCursorInListItem from '../locations/isCursorInListItem';
import isSelectionWithinNoninitialListItem from '../locations/isSelectionWithinNoninitialListItem';
import unwrapSelectionFromList from '../transforms/unwrapSelectionFromList';
import mergeWithPreviousListItem from '../transforms/mergeWithPreviousListItem';
import isCursorAtNoninitialParagraphStart from '../locations/isCursorAtNoninitialParagraphStart';

function keyDownBackspace(editor) {
  if (!editor.selection) return;

  // ignore if selection is expanded, cursor is not at the beginning or not immediately in a list item, or cursor is at the beginning of a non-initial paragraph
  if (
    !Range.isCollapsed(editor.selection) ||
    editor.selection.anchor.offset !== 0 ||
    !isCursorInListItem(editor, true) ||
    isCursorAtNoninitialParagraphStart(editor)
  ) {
    return;
  }

  if (isSelectionWithinNoninitialListItem(editor)) {
    mergeWithPreviousListItem(editor);
  } else {
    unwrapSelectionFromList(editor);
  }

  return false;
}

export default keyDownBackspace;
