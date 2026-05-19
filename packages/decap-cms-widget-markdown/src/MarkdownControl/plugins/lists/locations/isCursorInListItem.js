import { Editor, Element } from 'slate';

function isCursorInListItem(editor, immediate) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n =>
        Element.isElement(n) &&
        Editor.isBlock(editor, n) &&
        n.type !== 'paragraph' &&
        (immediate || !`${n.type}`.startsWith('heading-')),
      mode: 'lowest',
    }),
  );

  return !!match && match[0].type === 'list-item';
}

export default isCursorInListItem;
