import { Editor, Transforms } from 'slate';

import defaultEmptyBlock from '../blocks/defaultEmptyBlock';

function withShortcodes(editor) {
  const { isVoid, isInline, normalizeNode } = editor;

  editor.isVoid = element => {
    if (element.type === 'shortcode') {
      return true;
    }
    if (element.type === 'inline-shortcode') {
      return element.data && element.data.isVoid !== undefined ? element.data.isVoid : true;
    }
    return isVoid(element);
  };

  editor.isInline = element => {
    return element.type === 'inline-shortcode' ? true : isInline(element);
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
