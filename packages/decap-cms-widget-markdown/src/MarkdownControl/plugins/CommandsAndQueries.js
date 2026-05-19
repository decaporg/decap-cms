import isArray from 'lodash/isArray';
import tail from 'lodash/tail';
import castArray from 'lodash/castArray';

function CommandsAndQueries({ defaultType }) {
  return {
    queries: {
      atStartOf(editor, node) {
        const { selection } = editor.value;
        return selection.isCollapsed && selection.start.isAtStartOfNode(node);
      },
      getAncestor(editor, firstKey, lastKey) {
        if (firstKey === lastKey) {
          return editor.value.document.getParent(firstKey);
        }
        return editor.value.document.getCommonAncestor(firstKey, lastKey);
      },
      getOffset(editor, node) {
        const parent = editor.value.document.getParent(node.key);
        return parent.nodes.indexOf(node);
      },
      getSelectedChildren(editor, node) {
        return node.nodes.filter(child => editor.isSelected(child));
      },
      getCommonAncestor(editor) {
        const { startBlock, endBlock, document: doc } = editor.value;
        return doc.getCommonAncestor(startBlock.key, endBlock.key);
      },
      getClosestType(editor, node, type) {
        const types = castArray(type);
        return editor.value.document.getClosest(node.key, n => types.includes(n.type));
      },
      getBlockContainer(editor, node) {
        const targetTypes = ['bulleted-list', 'numbered-list', 'list-item', 'quote', 'table-cell'];
        const { startBlock, selection } = editor.value;
        const target = node
          ? editor.value.document.getParent(node.key)
          : (selection.isCollapsed && startBlock) || editor.getCommonAncestor();
        if (!target) {
          return editor.value.document;
        }
        if (targetTypes.includes(target.type)) {
          return target;
        }
        return editor.getBlockContainer(target);
      },
      isSelected(editor, nodes) {
        return castArray(nodes).every(node => {
          return editor.value.document.isInRange(node.key, editor.value.selection);
        });
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
      hasQuote(editor, quoteLabel) {
        const { value } = editor;
        const { document, blocks } = value;
        return blocks.some(node => {
          const { key: descendantNodeKey } = node;
          /* When focusing a quote block, the actual block that gets the focus is the paragraph block whose parent is a `quote` block.
          Hence, we need to get its parent and check if its type is `quote`. This parent will always be defined because every block in the editor
          has a Document object as parent by default.
          */
          const parent = document.getParent(descendantNodeKey);
          return parent.type === quoteLabel;
        });
      },
      hasListItems(editor, listType) {
        const { value } = editor;
        const { document, blocks } = value;
        return blocks.some(node => {
          const { key: lowestNodeKey } = node;
          /* A list block has the following structure:
          <ol>
            <li>
              <p>Coffee</p>
            </li>
            <li>
              <p>Tea</p>
            </li>
          </ol>
          */
          const parent = document.getParent(lowestNodeKey);
          const grandparent = document.getParent(parent.key);
          return parent.type === 'list-item' && grandparent?.type === listType;
        });
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
            return editor.setBlocks(editor.everyBlock(type) ? defaultType : type);
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
      unwrapNodeFromAncestor(editor, node, ancestor) {
        const depth = ancestor.getDepth(node.key);
        editor.unwrapNodeToDepth(node, depth);
      },
    },
  };
}

export default CommandsAndQueries;
