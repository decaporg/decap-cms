import { Editor, Element } from 'slate';

function isCursorInNonDefaultBlock(editor) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n => Element.isElement(n) && Editor.isBlock(editor, n) && n.type !== 'paragraph',
      mode: 'lowest',
    }),
  );

  return !!match && !Editor.isEditor(match[0]);
}

export default isCursorInNonDefaultBlock;
