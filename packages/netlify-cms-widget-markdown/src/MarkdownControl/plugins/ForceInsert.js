import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const ForceInsert = () => ({
  queries: {
    canInsertBeforeNode(editor, node) {
      if (!editor.isVoid(node)) {
        return;
      }
      return !!editor.value.document.getPreviousSibling(node.key);
    },
    canInsertAfterNode(editor, node) {
      if (!editor.isVoid(node)) {
        return;
      }
      const nextSibling = editor.value.document.getNextSibling(node.key);
      return !editor.isVoid(nextSibling);
    },
  },
  commands: {
    forceInsertAtDocumentStart(editor) {
      const block = { type: SLATE_DEFAULT_BLOCK_TYPE, object: 'block' };
      return editor
        .insertNodeByKey(editor.value.document.key, 0, block)
        .moveToStartOfDocument();
    },
    forceInsertAfterNode(editor, node) {
      return editor
        .moveToEndOfNode(node)
        .insertBlock(SLATE_DEFAULT_BLOCK_TYPE)
        .focus();
    },
    moveToEndOfDocument(editor) {
      const lastBlock = editor.value.document.nodes.last();
      if (editor.isVoid(lastBlock)) {
        editor.insertBlock(SLATE_DEFAULT_BLOCK_TYPE);
      }
      editor.focus();
    },
  },
});

export default ForceInsert;
