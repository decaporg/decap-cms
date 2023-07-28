import { Editor, Element } from 'slate';

function isCursorInBlockType(editor, type, ignoreHeadings, ignoreLists) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n =>
        Element.isElement(n) &&
        Editor.isBlock(editor, n) &&
        n.type !== 'paragraph' &&
        n.type !== 'list-item' &&
        (ignoreHeadings || !`${n.type}`.startsWith('heading-')) &&
        (!ignoreLists || !`${n.type}`.endsWith('-list')),
      mode: 'lowest',
    }),
  );

  return (
    !!match &&
    (match[0].type === type ||
      `${match[0].type}`.startsWith(`${type}-` || `${match[0].type}`.endsWith(`-${type}`)))
  );
}

export default isCursorInBlockType;
