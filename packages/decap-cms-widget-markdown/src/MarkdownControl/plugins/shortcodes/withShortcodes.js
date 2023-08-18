import { Editor, Transforms } from 'slate';

import defaultEmptyBlock from '../blocks/defaultEmptyBlock';

function withShortcodes(editor) {
  const { isVoid, normalizeNode } = editor;

  editor.isVoid = element => {
    return element.type === 'shortcode' ? true : isVoid(element);
  };

  // Prevent empty editor after deleting shortcode theat was only child
  editor.normalizeNode = entry => {
    const [node] = entry;

    if (Editor.isEditor(node) && node.children.length == 0) {
      Transforms.insertNodes(editor, defaultEmptyBlock());
    }

    normalizeNode(entry);
  };

  return editor;
}

export default withShortcodes;
