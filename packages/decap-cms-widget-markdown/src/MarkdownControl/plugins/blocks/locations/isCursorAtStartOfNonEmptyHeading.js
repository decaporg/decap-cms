import { Editor, Element } from 'slate';

function isCursorAtStartOfNonEmptyHeading(editor) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n =>
        Element.isElement(n) && Editor.isBlock(editor, n) && `${n.type}`.startsWith('heading-'),
      mode: 'lowest',
    }),
  );

  return (
    !!match &&
    Editor.isStart(editor, editor.selection.focus, match[1]) &&
    !Editor.isEmpty(editor, match[0])
  );
}

export default isCursorAtStartOfNonEmptyHeading;
