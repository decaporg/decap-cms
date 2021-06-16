import { List } from 'immutable';
import { castArray, throttle } from 'lodash';
import { Block } from 'slate';

import { assertType } from './util';
import { SLATE_LIST_BLOCK_TYPES as LIST_SCHEMA } from '../../types';

function ListPlugin({ defaultType, unorderedListType, orderedListType }) {
  const LIST_TYPES = [orderedListType, unorderedListType];

  function oppositeListType(type) {
    switch (type) {
      case LIST_TYPES[0]:
        return LIST_TYPES[1];
      case LIST_TYPES[1]:
        return LIST_TYPES[0];
    }
  }

  return {
    queries: {
      getCurrentListItem(editor) {
        const { startBlock, endBlock } = editor.value;
        const ancestor = editor.value.document.getCommonAncestor(startBlock.key, endBlock.key);
        if (ancestor && ancestor.type === 'list-item') {
          return ancestor;
        }
        return editor.value.document.getClosest(ancestor.key, node => node.type === 'list-item');
      },
      getListOrListItem(editor, { node, ...opts } = {}) {
        const listContextNode = editor.getBlockContainer(node);
        if (!listContextNode) {
          return;
        }
        if (['bulleted-list', 'numbered-list', 'list-item'].includes(listContextNode.type)) {
          return listContextNode;
        }
        if (opts.force) {
          return editor.getListOrListItem({ node: listContextNode, ...opts });
        }
      },
      isList(editor, node) {
        return node && LIST_TYPES.includes(node.type);
      },
      getLowestListItem(editor, list) {
        assertType(list, LIST_TYPES);
        const lastItem = list.nodes.last();
        const lastItemLastChild = lastItem.nodes.last();
        if (editor.isList(lastItemLastChild)) {
          return editor.getLowestListItem(lastItemLastChild);
        }
        return lastItem;
      },
    },
    commands: {
      wrapInList(editor, type) {
        editor.withoutNormalizing(() => {
          editor.wrapBlock(type).wrapBlock('list-item');
        });
      },
      unwrapListItem(editor, node) {
        assertType(node, 'list-item');
        editor.withoutNormalizing(() => {
          editor.unwrapNodeByKey(node.key).unwrapBlockChildren(node);
        });
      },
      indentListItems: throttle(function indentListItem(editor, listItemsArg) {
        const listItems = List.isList(listItemsArg) ? listItemsArg : List(castArray(listItemsArg));
        const firstListItem = listItems.first();
        const firstListItemIndex = editor.value.document.getPath(firstListItem.key).last();
        const list = editor.value.document.getParent(firstListItem.key);

        /**
         * If the first list item in the list is in the selection, and the list
         * previous sibling is a list of the opposite type, we should still indent
         * the list items as children of the last item in the previous list, as
         * the behavior otherwise for first items is to do nothing on tab, while
         * in this case the user would expect indenting via tab to "just work".
         */
        if (firstListItemIndex === 0) {
          const listPreviousSibling = editor.value.document.getPreviousSibling(list.key);
          if (!listPreviousSibling || listPreviousSibling.type !== oppositeListType(list.type)) {
            return;
          }
          editor.withoutNormalizing(() => {
            listItems.forEach((listItem, idx) => {
              const index = listPreviousSibling.nodes.size + idx;
              editor.moveNodeByKey(listItem.key, listPreviousSibling.key, index);
            });
          });
        }

        /**
         * Wrap all selected list items into a new list item and list, then merge
         * the new parent list item into the previous list item in the list.
         */
        const newListItem = Block.create('list-item');
        const newList = Block.create(list.type);
        editor.withoutNormalizing(() => {
          editor
            .insertNodeByKey(list.key, firstListItemIndex, newListItem)
            .insertNodeByKey(newListItem.key, 0, newList);

          listItems.forEach((listItem, index) => {
            editor.moveNodeByKey(listItem.key, newList.key, index);
          });

          editor.mergeNodeByKey(newListItem.key);
        });
      }, 100),
      unindentListItems: throttle(function unindentListItems(editor, listItemsArg) {
        // Ensure that `listItems` are children of a list.
        const listItems = List.isList(listItemsArg) ? listItemsArg : List(castArray(listItemsArg));
        const list = editor.value.document.getParent(listItems.first().key);
        if (!editor.isList(list)) {
          return;
        }

        // If the current list isn't nested under a list, we cannot unindent.
        const parentListItem = editor.value.document.getParent(list.key);
        if (!parentListItem || parentListItem.type !== 'list-item') {
          return;
        }

        // Check if there are more list items after the items being indented.
        const nextSibling = editor.value.document.getNextSibling(listItems.last().key);

        // Unwrap each selected list item into the parent list.
        editor.withoutNormalizing(() => {
          listItems.forEach(listItem => editor.unwrapNodeToDepth(listItem, 2));
        });

        // If there were other list items after the selected items, use the last
        // of the unindented list items as the new parent of the remaining items
        // list.
        if (nextSibling) {
          const nextSiblingParentListItem = editor.value.document.getNextSibling(
            listItems.last().key,
          );
          editor.mergeNodeByKey(nextSiblingParentListItem.key);
        }
      }, 100),
      toggleListItemType(editor, listItem) {
        assertType(listItem, 'list-item');
        const list = editor.value.document.getParent(listItem.key);
        const newListType = oppositeListType(list.type);
        editor.withoutNormalizing(() => {
          editor.unwrapNodeByKey(listItem.key).wrapBlockByKey(listItem.key, newListType);
        });
      },
      toggleList(editor, type) {
        if (!LIST_TYPES.includes(type)) {
          throw Error(`${type} is not a valid list type, must be one of: ${LIST_TYPES}`);
        }
        const { blocks, document } = editor.value;
        const isListItem = editor.hasBlock('list-item');
        console.log({ isListItem });
        const isItemOfGivenListType = blocks.some(block => {
          // Get the closest parent of the focused block that is either bulleted-list or numbered-list, depending on the `type` parameter passed in
          const list = document.getClosest(block.key, parent => parent.type === type);
          return !!list;
        });
        if (isListItem && isItemOfGivenListType) {
          editor.withoutNormalizing(() => {
            editor.setBlocks(defaultType).unwrapBlock(type);
          });
        } else if (isListItem) {
          editor.withoutNormalizing(() => {
            editor
              .unwrapBlock(type === LIST_TYPES[0] ? LIST_TYPES[1] : LIST_TYPES[0])
              .wrapBlock(type);
          });
        } else {
          editor.withoutNormalizing(() => {
            editor.setBlocks(LIST_SCHEMA.children).wrapBlock(type);
          });
        }
      },
    },
    /** This onKeyDown handler only applies when a list item block contains a paragraph block, which is no longer the case.
     * TODO: rewrite the onKeyDown handler for Tab and Backspace key. The Enter key is already handled in
     * BreakToDefaultBlock plugin because it is loaded after this List plugin and will override whatever behaviour is defined here.
     */
    // onKeyDown(event, editor, next) {
    //   // Handle Backspace
    //   if (isHotkey('backspace', event) && editor.value.selection.isCollapsed) {
    //     // If beginning block is not of default type, do nothing
    //     if (editor.value.startBlock.type !== defaultType) {
    //       return next();
    //     }
    //     const listOrListItem = editor.getListOrListItem();
    //     const isListItem = listOrListItem && listOrListItem.type === 'list-item';

    //     // If immediate block is a list item, unwrap it
    //     if (isListItem && editor.value.selection.start.isAtStartOfNode(listOrListItem)) {
    //       const listItem = listOrListItem;
    //       const previousSibling = editor.value.document.getPreviousSibling(listItem.key);

    //       // If this isn't the first item in the list, merge into previous list item
    //       if (previousSibling && previousSibling.type === 'list-item') {
    //         return editor.mergeNodeByKey(listItem.key);
    //       }
    //       return editor.unwrapListItem(listItem);
    //     }

    //     return next();
    //   }

    //   // Handle Tab
    //   if (isHotkey('tab', event) || isHotkey('shift+tab', event)) {
    //     const isTab = isHotkey('tab', event);
    //     const isShiftTab = !isTab;
    //     event.preventDefault();

    //     const listOrListItem = editor.getListOrListItem({ force: true });
    //     if (!listOrListItem) {
    //       return next();
    //     }

    //     if (listOrListItem.type === 'list-item') {
    //       const listItem = listOrListItem;
    //       if (isTab) {
    //         return editor.indentListItems(listItem);
    //       }
    //       if (isShiftTab) {
    //         return editor.unindentListItems(listItem);
    //       }
    //     } else {
    //       const list = listOrListItem;
    //       if (isTab) {
    //         const listItems = editor.getSelectedChildren(list);
    //         return editor.indentListItems(listItems);
    //       }
    //       if (isShiftTab) {
    //         const listItems = editor.getSelectedChildren(list);
    //         return editor.unindentListItems(listItems);
    //       }
    //     }
    //     return next();
    //   }

    //   // Handle Enter
    //   if (isHotkey('enter', event)) {
    //     const listOrListItem = editor.getListOrListItem();
    //     if (!listOrListItem) {
    //       return next();
    //     }

    //     if (editor.value.selection.isExpanded) {
    //       editor.delete();
    //     }

    //     if (listOrListItem.type === 'list-item') {
    //       const listItem = listOrListItem;

    //       // If focus is at start of list item, unwrap the entire list item.
    //       if (editor.atStartOf(listItem)) {
    //         return editor.unwrapListItem(listItem);
    //       }

    //       // If focus is at start of a subsequent block in the list item, move
    //       // everything after the cursor in the current list item to a new list
    //       // item.
    //       if (editor.atStartOf(editor.value.startBlock)) {
    //         const newListItem = Block.create('list-item');
    //         const range = Range.create(editor.value.selection).moveEndToEndOfNode(listItem);

    //         return editor.withoutNormalizing(() => {
    //           editor.wrapBlockAtRange(range, newListItem).unwrapNodeByKey(newListItem.key);
    //         });
    //       }

    //       return next();
    //     } else {
    //       const list = listOrListItem;
    //       if (list.nodes.size === 0) {
    //         return editor.removeNodeByKey(list.key);
    //       }
    //     }
    //     return next();
    //   }
    //   return next();
    // },
  };
}

export default ListPlugin;
