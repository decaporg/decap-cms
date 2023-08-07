import keyDown from './events/keyDown';
import toggleBlock from './events/toggleBlock';

function withBlocks(editor) {
  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => keyDown(event, editor));

  editor.toggleBlock = type => toggleBlock(editor, type);

  return editor;
}

export default withBlocks;
