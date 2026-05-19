import { Editor, Transforms } from 'slate';

function splitIntoParagraph(editor) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.splitNodes(editor, { always: true });
    Transforms.setNodes(editor, { type: 'paragraph' });
  });

  Editor.normalize(editor, { force: true });
  return true;
}

export default splitIntoParagraph;
