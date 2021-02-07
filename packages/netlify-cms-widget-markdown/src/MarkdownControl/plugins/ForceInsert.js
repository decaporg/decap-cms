function ForceInsert({ defaultType }) {
  return {
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
        const nextSibling = editor.value.document.getNextSibling(node.key);
        return nextSibling && !editor.isVoid(nextSibling);
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
        return editor.moveToEndOfNode(lastBlock).focus();
      },
    },
  };
}

export default ForceInsert;
