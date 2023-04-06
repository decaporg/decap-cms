import { Editor, Element } from "slate";

import keyDown from "./keyDown";

function withLists(editor) {
  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => keyDown(event, editor));

  editor.isListItem = () => {
      const { selection } = editor;
      if (!selection) return false;

      const [match] = Array.from(
        Editor.nodes(editor, {
          at: Editor.unhangRange(editor, selection),
          match: n =>
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            Editor.isBlock(editor, n) &&
            n.type !== 'paragraph' &&
            !`${n.type}`.startsWith('heading-'),
          mode: 'lowest',
        }),
      );

      return !!match && match[0].type === 'list-item';
  }

  return editor;
}

export default withLists;
