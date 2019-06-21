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
    everyBlock(editor, type) {
      return editor.value.blocks.every(block => block.type === type);
    },
    hasMark(editor, type) {
      return editor.value.activeMarks.some(mark => mark.type === type);
    },
    hasBlock(editor, type) {
      return editor.value.blocks.some(node => node.type === type);
    },
    hasInline(editor, type) {
      return editor.value.inlines.some(node => node.type === type);
    },
  },
  commands: {
    toggleBlock(editor, type) {
      switch (type) {
        case 'heading-one':
        case 'heading-two':
        case 'heading-three':
        case 'heading-four':
        case 'heading-five':
        case 'heading-six':
          return editor.setBlocks(editor.everyBlock(type) ? SLATE_DEFAULT_BLOCK_TYPE : type);
        case 'quote':
          return editor.toggleQuoteBlock();
        case 'numbered-list':
        case 'bulleted-list': {
          return editor.toggleList(type);
        }
      }
    },
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
