const ForceInsert = ({ defaultType }) => ({
  queries: {
    canInsertBeforeNode(editor, node) {
      if (!editor.isVoid(node)) {
        return true;
      }
      return !!editor.value.document.getPreviousSibling(node.key);
    },
    canInsertAfterNode(editor, node) {
      if (!editor.isVoid(node)) {
        return true;
      }

      // The static insertion point at the bottom of the editor ensures nodes
      // can be inserted after trailing void nodes, so we only return false if
      // the current and next sibling are both void.
      const nextSibling = editor.value.document.getNextSibling(node.key);
      return !nextSibling || !editor.isVoid(nextSibling);
    },
  },
  commands: {
    forceInsertBeforeNode(editor, node) {
      const block = { type: defaultType, object: 'block' };
      const parent = editor.value.document.getParent(node.key);
      return editor
        .insertNodeByKey(parent.key, 0, block)
        .moveToStartOfNode(parent)
        .focus();
    },
    forceInsertAfterNode(editor, node) {
      return editor
        .moveToEndOfNode(node)
        .insertBlock(defaultType)
        .focus();
    },
    moveToEndOfDocument(editor) {
      const lastBlock = editor.value.document.nodes.last();
      if (editor.isVoid(lastBlock)) {
        editor.insertBlock(defaultType);
      }
      editor.focus();
    },
  },
});

export default ForceInsert;
