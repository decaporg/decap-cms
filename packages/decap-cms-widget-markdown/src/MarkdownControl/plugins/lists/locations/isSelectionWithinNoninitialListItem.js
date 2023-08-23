import { Editor, Range } from 'slate';

function isSelectionWithinNoninitialListItem(editor) {
  if (!editor.selection) return false;

  const [, path] = Editor.above(editor, {
    match: n => n.type === 'list-item',
    mode: 'lowest',
    at: Range.start(editor.selection),
  });
  if (path && path.length > 0 && path[path.length - 1] > 0) return true;
}

export default isSelectionWithinNoninitialListItem;
