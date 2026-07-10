import { Editor, Range } from 'slate';

function isCursorCollapsedAfterSoftBreak(editor) {
  const { selection } = editor;
  if (!selection) return false;
  if (Range.isExpanded(selection)) return false;

  const previous = Editor.previous(editor);

  return previous && previous[0].type == 'break';
}

export default isCursorCollapsedAfterSoftBreak;
