import { Range } from 'slate';

function isCursorAtNoninitialParagraphStart(editor) {
  if (!editor.selection) return false;

  const { offset, path } = Range.start(editor.selection);

  return offset == 0 && path.length > 2 && path[path.length - 2] > 0;
}

export default isCursorAtNoninitialParagraphStart;
