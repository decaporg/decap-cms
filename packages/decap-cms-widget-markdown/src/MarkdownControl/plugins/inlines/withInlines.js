import keyDown from './events/keyDown';

function withInlines(editor) {
  const { isInline, isVoid } = editor;

  editor.isInline = element =>
    ['link', 'button', 'break', 'image'].includes(element.type) || isInline(element);

  editor.isVoid = element =>
    ['break', 'image', 'thematic-break'].includes(element.type) || isVoid(element);

  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => keyDown(event, editor));

  return editor;
}

export default withInlines;
