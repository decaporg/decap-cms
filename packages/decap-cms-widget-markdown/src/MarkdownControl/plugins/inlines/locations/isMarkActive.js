import { Editor } from 'slate';

function isMarkActive(editor, format) {
  const { selection } = editor;
  if (!selection) return false;

  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
}

export default isMarkActive;
