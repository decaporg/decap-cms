import { Block } from 'slate';
import isHotkey from 'is-hotkey';

/**
 * TODO: highlight a couple list items and hit the quote button. doesn't work.
 */
function QuoteBlock({ type }) {
  return {
    commands: {
      /**
       * Quotes can contain other blocks, even other quotes. If a selection contains quotes, they
       * shouldn't be impacted. The selection's immediate parent should be checked - if it's a
       * quote, unwrap the quote (as within are only blocks), and if it's not, wrap all selected
       * blocks into a quote. Make sure text is wrapped into paragraphs.
       */
      toggleQuoteBlock(editor) {
        const blockContainer = editor.getBlockContainer();
        if (['bulleted-list', 'numbered-list'].includes(blockContainer.type)) {
          const { nodes } = blockContainer;
          const allItemsSelected = editor.isSelected([nodes.first(), nodes.last()]);
          if (allItemsSelected) {
            const nextContainer = editor.getBlockContainer(blockContainer);
            if (nextContainer?.type === type) {
              editor.unwrapNodeFromAncestor(blockContainer, nextContainer);
            } else {
              editor.wrapBlockByKey(blockContainer.key, type);
            }
          } else {
            const blockContainerParent = editor.value.document.getParent(blockContainer.key);
            editor.withoutNormalizing(() => {
              const selectedListItems = nodes.filter(node => editor.isSelected(node));
              const newList = Block.create(blockContainer.type);
              editor.unwrapNodeByKey(selectedListItems.first());
              const offset = editor.getOffset(selectedListItems.first());
              editor.insertNodeByKey(blockContainerParent.key, offset + 1, newList);
              selectedListItems.forEach(({ key }, idx) =>
                editor.moveNodeByKey(key, newList.key, idx),
              );
              editor.wrapBlockByKey(newList.key, type);
            });
          }
          return;
        }

        const blocks = editor.value.blocks;
        const firstBlockKey = blocks.first().key;
        const lastBlockKey = blocks.last().key;
        const ancestor = editor.getAncestor(firstBlockKey, lastBlockKey);
        if (ancestor.type === type) {
          editor.unwrapBlockChildren(ancestor);
        } else {
          editor.wrapBlock(type);
        }
      },
    },
    onKeyDown(event, editor, next) {
      if (!isHotkey('enter', event) && !isHotkey('backspace', event)) {
        return next();
      }
      const { selection, startBlock, document: doc } = editor.value;
      const parent = doc.getParent(startBlock.key);
      const isQuote = parent.type === type;
      if (!isQuote) {
        return next();
      }
      if (isHotkey('enter', event)) {
        if (selection.isExpanded) {
          editor.delete();
        }

        // If the quote is empty, remove it.
        if (editor.atStartOf(parent)) {
          return editor.unwrapBlockByKey(parent.key);
        }

        if (editor.atStartOf(startBlock)) {
          const offset = editor.getOffset(startBlock);
          return editor
            .splitNodeByKey(parent.key, offset)
            .unwrapBlockByKey(editor.value.document.getParent(startBlock.key).key);
        }

        return next();
      } else if (isHotkey('backspace', event)) {
        if (selection.isExpanded) {
          editor.delete();
        }
        if (!editor.atStartOf(parent)) {
          return next();
        }
        const previousParentSibling = doc.getPreviousSibling(parent.key);
        if (previousParentSibling && previousParentSibling.type === type) {
          return editor.mergeNodeByKey(parent.key);
        }

        return editor.unwrapNodeByKey(startBlock.key);
      }
      return next();
    },
  };
}

export default QuoteBlock;
