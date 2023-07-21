import { Editor, Transforms } from 'slate';

function keyDownShiftEnter(editor) {
  if (!editor.selection) return;

  const focus = {
    path: [
      ...editor.selection.focus.path.slice(0, -1),
      editor.selection.focus.path[editor.selection.focus.path.length - 1] + 2,
    ],
    offset: 0,
  };

  Transforms.insertNodes(editor, {
    type: 'break',
    children: [
      {
        text: '',
      },
    ],
  });
  Editor.normalize(editor, { force: true });

  Transforms.select(editor, focus);
  return false;
}

export default keyDownShiftEnter;
