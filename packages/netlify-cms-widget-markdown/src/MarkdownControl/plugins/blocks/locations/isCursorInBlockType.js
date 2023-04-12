import { Editor, Element } from "slate";

function isCursorInBlockType(editor, type, ignoreHeadings) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n =>
        Element.isElement(n) &&
        Editor.isBlock(editor, n) &&
        n.type !== 'paragraph' &&
        (ignoreHeadings || !`${n.type}`.startsWith('heading-')),
      mode: 'lowest',
    }),
  );

  return !!match && (match[0].type === type || `${match[0].type}`.startsWith(`${type}-`));
}

export default isCursorInBlockType;
