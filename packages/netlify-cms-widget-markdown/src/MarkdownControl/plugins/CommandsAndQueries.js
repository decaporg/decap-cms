import { isArray, tail } from 'lodash';

const CommandsAndQueries = () => ({
  queries: {
    getSelectedChildren(editor, node) {
      return node.nodes.filter(child => editor.isSelected(child));
    },
    getCommonAncestor(editor) {
      const { startBlock, endBlock, document: doc } = editor.value;
      return doc.getCommonAncestor(startBlock.key, endBlock.key);
    },
    getClosestType(editor, key, type) {
      return editor.value.document.getClosest(key, node => node.type === type);
    },
    isSelected(editor, node) {
      return editor.value.document.isNodeInRange(node.key, editor.value.selection);
    },
    isFirstChild(editor, node) {
      return editor.value.document.getParent(node.key).nodes.first().key === node.key;
    },
    areSiblings(editor, nodes) {
      if (!isArray(nodes) || nodes.length < 2) {
        return true;
      }
      const parent = editor.value.document.getParent(nodes[0].key);
      return tail(nodes).every(node => {
        return editor.value.document.getParent(node.key).key === parent.key;
      });
    },
  },
  commands: {
    unwrapBlockChildren(editor, block) {
      if (!block || block.object !== 'block') {
        throw Error(`Expected block but received ${block}.`);
      }
      const index = editor.value.document.getPath(block.key).last();
      const parent = editor.value.document.getParent(block.key);
      editor.withoutNormalizing(() => {
        block.nodes.forEach((node, idx) => {
          editor.moveNodeByKey(node.key, parent.key, index + idx);
        });
        editor.removeNodeByKey(block.key);
      });
    },
    unwrapNodeToDepth(editor, node, depth) {
      let currentDepth = 0;
      editor.withoutNormalizing(() => {
        while (currentDepth < depth) {
          editor.unwrapNodeByKey(node.key);
          currentDepth += 1;
        }
      });
    },
  },
});

export default CommandsAndQueries;
