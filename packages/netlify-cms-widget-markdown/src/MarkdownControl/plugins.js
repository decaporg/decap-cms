import { castArray, isArray, tail, throttle, get } from 'lodash';
import { List } from 'immutable';
import { Text, Inline, Range, Block } from 'slate';
import isHotkey from 'is-hotkey';

const DEFAULT_BLOCK_TYPE = 'paragraph';
const LIST_TYPES = [
  'bulleted-list',
  'numbered-list',
];
const BLOCK_PARENTS = [
  'list-item',
  'quote',
];

function oppositeListType(type) {
  switch (type) {
    case LIST_TYPES[0]: return LIST_TYPES[1];
    case LIST_TYPES[1]: return LIST_TYPES[0];
  }
}

const SoftBreak = (options = {}) => ({
  onKeyDown(event, editor, next) {
    if (options.shift && !isHotkey('shift+enter', event)) return next();
    if (!options.shift && !isHotkey('enter', event)) return next();

    const { onlyIn, ignoreIn, defaultBlock = 'paragraph' } = options;
    const { type: blockType, text, key } = editor.value.startBlock;
    const { type: parentType, parentKey } = editor.value.document.getParent(key);
    const targetParentBlock = BLOCK_PARENTS.includes(parentType);
    const type = targetParentBlock ? parentType : blockType;
    if (onlyIn && !onlyIn.includes(type)) return next();
    if (ignoreIn && ignoreIn.includes(type)) return next();

    if (targetParentBlock) {
      const shouldClose = text === '';
      if (shouldClose) {
        editor.unwrapNodeByKey(key);
      }
      return next();
    } else {
      const shouldClose = text.endsWith('\n');
      if (shouldClose) {
        editor.deleteBackward(1).insertBlock(defaultBlock);
      }

      const textNode = Text.create('\n');
      const breakNode = Inline.create({ type: 'break', nodes: [textNode] });
      editor
        .insertInline(breakNode)
        .insertText('')
        .moveToStartOfNextText();
    }
  },
});

const BreakToDefaultBlock = () => ({
  onKeyDown(event, editor, next) {
    const isEnter = isHotkey('enter', event);
    const isBackspace = isHotkey('backspace', event);
    if (!isEnter && !isBackspace) {
      return next();
    }
    if (editor.value.selection.isExpanded) {
      if (isEnter) {
        editor.delete();
      }
      return next();
    }
    const block = editor.value.startBlock;
    if (block.type !== DEFAULT_BLOCK_TYPE) {
      return next();
    }
    if (editor.value.selection.start.isAtStartOfNode(block)) {
      const parent = editor.value.document.getParent(block.key);
      if (['quote'].includes(parent.type)) {
        editor.unwrapNodeByKey(block.key);
        return;
      }
    }
    return next();
  },
});

function assertType(nodes, type) {
  const nodesArray = castArray(nodes);
  const validate = isArray(type) ? node => type.includes(node.type) : node => type === node.type;
  const invalidNode = nodesArray.find(node => !validate(node));
  if (invalidNode) {
    throw Error(`Expected node of type "${type}", received "${node.type}".`);
  };
  return true;
}

/**
 * TODO:
 * - close list item after second enter, should collapse to previous level if
 *   nested
 * - make sure nested empty list items (can be read in from markdown) don't cause list handling to break
 * - closing a block in a nested list item via backspace should only close the
 *   immediate block
 * - backspace should close a list item without opening a new list item in the
 *   ancestor list, and next backspace should do the norm, move selection to end
 *   of previous list item
 * - tab pressed inside of nested block within list item, eg. quote, but with
 *   the cursor at the very beginning of the block, should indent the parent
 *   list item
 * - other tab handlers (should only be code block) should be registered before
 *   this, as it will attempt to tab expanded selections where the entire
 *   selection shares a common list item ancestor
 * - handle enter when it's pressed in a block child of a list item?
 * - handle expanded enter
 * - ideally you'd put list plugin last so others can intercept keyboard actions
 *   for nested types, but a list can be nested in a quote, so how do we ensure
 *   the action only hits the closest of the two (quote or list item)?
 * - handle list button/tab/enter inside of quote (and eventually table, should be same though)
 * - test multiple subsequent lists of same and different types
 * - tab multiple list items when selection is expanded
 * - tab multiple nested lists and items when selection is expanded
 * - empty new list item is parsed as a literal asterisk in markdown until non-empty
 */
const ListPlugin = options => ({
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
    getCurrentListItem(editor) {
      const { startBlock, endBlock } = editor.value;
      const ancestor = editor.value.document.getCommonAncestor(startBlock.key, endBlock.key);
      if (ancestor && ancestor.type === 'list-item') {
        return ancestor;
      }
      return editor.value.document.getClosest(ancestor.key, node => node.type === 'list-item');
    },
    getListOrListItem(editor, { node, ...opts } = {}) {
      const listContextNode = editor.getListContextNode(node);
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
    isSelected(editor, node) {
      return editor.value.document.isNodeInRange(node.key, editor.value.selection);
    },
    getListContextNode(editor, node) {
      const targetTypes = ['bulleted-list', 'numbered-list', 'list-item', 'quote', 'table-cell'];
      const { startBlock, endBlock, selection } = editor.value;
      const target = node
        ? editor.value.document.getParent(node.key)
        : (selection.isCollapsed && startBlock) || editor.getCommonAncestor();
      if (!target) {
        return;
      }
      if (targetTypes.includes(target.type)) {
        return target;
      }
      return editor.getListContextNode(target);
    },
    isFirstChild(editor, node) {
      return editor.value.document.getParent(node.key).nodes.first().key === node.key;
    },
    areSiblings(editor, nodes) {
      if (!isArray(nodes) || nodes.length < 2) {
        return true;
      }
      const parent = editor.value.document.getParent(nodes[0].key)
      return tail(nodes).every(node => {
        return editor.value.document.getParent(node.key).key === parent.key;
      });
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
    moveToEndOfNode(editor, node, parent) {
      editor.moveNodeByKey(node.key, parent.key, parent.nodes.size);
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
    wrapInList(editor, type) {
      editor.withoutNormalizing(() => {
        editor
          .wrapBlock(type)
          .wrapBlock('list-item');
      });
    },
    unwrapListItem(editor, node) {
      assertType(node, 'list-item');
      editor.withoutNormalizing(() => {
        editor
          .unwrapNodeByKey(node.key)
          .unwrapBlockChildren(node);
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
        const nextSiblingParentListItem = editor.value.document.getNextSibling(listItems.last().key);
        editor.mergeNodeByKey(nextSiblingParentListItem.key);
      }
    }, 100),
    toggleListItemType(editor, listItem) {
      assertType(listItem, 'list-item');
      const list = editor.value.document.getParent(listItem.key);
      const newListType = oppositeListType(list.type);
      editor.withoutNormalizing(() => {
        editor
          .unwrapNodeByKey(listItem.key)
          .wrapBlockByKey(listItem.key, newListType);
      });
    },
    toggleList(editor, type) {
      if (!LIST_TYPES.includes(type)) {
        throw Error(`${type} is not a valid list type, must be one of: ${LIST_TYPES}`);
      }
      const { startBlock, endBlock } = editor.value;
      const target = editor.getListContextNode();

      switch (get(target, 'type')) {
        case 'bulleted-list':
        case 'numbered-list': {
          const list = target;
          if (list.type !== type) {
            const newListType = oppositeListType(target.type);
            const newList = Block.create(newListType);
            editor.withoutNormalizing(() => {
              editor
                .wrapBlock(newList)
                .unwrapNodeByKey(newList.key);
            });
          } else {
            editor.withoutNormalizing(() => {
              list.nodes.forEach(listItem => {
                if (editor.isSelected(listItem)) {
                  editor.unwrapListItem(listItem);
                }
              });
            });
          }
          break;
        }

        case 'list-item': {
          const listItem = target;
          const list = editor.value.document.getParent(listItem.key);
          if (!editor.isFirstChild(startBlock)) {
            editor.wrapInList(type);
          }

          else if (list.type !== type) {
            editor.toggleListItemType(listItem);
          }

          else {
            editor.unwrapListItem(listItem);
          }
          break;
        }

        default: {
          editor.wrapInList(type);
          break;
        }
      }
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
  onKeyDown(event, editor, next) {
    /**
     * Backspace
     */
    if (isHotkey('backspace', event) && editor.value.selection.isCollapsed) {
      const listOrListItem = editor.getListOrListItem();
      const isListItem = listOrListItem && listOrListItem.type === 'list-item';
      if (isListItem && editor.value.selection.start.isAtStartOfNode(listOrListItem)) {
        const listItem = listOrListItem;
        const previousSibling = editor.value.document.getPreviousSibling(listItem.key);
        if (previousSibling && previousSibling.type === 'list-item') {
          editor.mergeNodeByKey(listItem.key);
        } else {
          editor.unwrapListItem(listItem);
        }
        return;
      }

      const block = editor.value.startBlock;
      const previousSibling = editor.value.document.getPreviousSibling(block.key);
      const isAtStart = editor.value.selection.start.isAtStartOfNode(block);
      if (block.type === DEFAULT_BLOCK_TYPE && isAtStart && editor.isList(previousSibling)) {
        editor.wrapInList(previousSibling.type);
        return;
      }

      return next();
    }

    /**
     * Tab, Shift+Tab
     */
    else if (isHotkey('tab', event) || isHotkey('shift+tab', event)) {
      const isTab = isHotkey('tab', event);
      const isShiftTab = !isTab;
      event.preventDefault();

      const listOrListItem = editor.getListOrListItem({ force: true });
      if (!listOrListItem) {
        return next();
      }

      if (listOrListItem.type === 'list-item') {
        const listItem = listOrListItem;
        if (isTab) {
          editor.indentListItems(listItem);
        }
        if (isShiftTab) {
          editor.unindentListItems(listItem);
        }
      }

      else {
        const list = listOrListItem;
        if (isTab) {
          const listItems = editor.getSelectedChildren(list);
          editor.indentListItems(listItems);
        }
        if (isShiftTab) {
          const listItems = editor.getSelectedChildren(list);
          editor.unindentListItems(listItems);
        }
      }
    }

    /**
     * Enter
     */
    else if (isHotkey('enter', event)) {
      const listOrListItem = editor.getListOrListItem();
      if (!listOrListItem) {
        return next();
      }

      if (editor.value.selection.isExpanded) {
        editor.delete();
      }

      if (listOrListItem.type === 'list-item') {
        const listItem = listOrListItem;

        // If the list item is empty, remove it.
        if (listItem.text === '' || editor.value.selection.start.isAtStartOfNode(listItem)) {
          editor.unwrapListItem(listItem);
        }

        // If current block is empty, or selection at start of block that is not
        // the first block, move the current block to a new list item.
        else if (
          editor.value.startBlock.text === '' ||
          !editor.value.selection.start.isAtStartOfNode(listItem) &&
          editor.value.selection.start.isAtStartOfNode(editor.value.startBlock)
        ) {
          const newListItem = Block.create('list-item');
          const range = Range
            .create(editor.value.selection)
            .moveEndToEndOfNode(listItem);

          editor.withoutNormalizing(() => {
            editor
              .wrapBlockAtRange(range, newListItem)
              .unwrapNodeByKey(newListItem.key);
          });
        }

        else {
          return next();
        }
      } else {
        const list = listOrListItem;
        if (list.nodes.size === 0) {
          editor.removeNodeByKey(list.key);
        }
      }
    }

    else {
      return next();
    }
  },
});

const Logger = () => ({
  commands: {
    log(editor) {
      console.log(editor.value);
    },
  },
  onKeyDown(event, editor, next) {
    if (isHotkey('mod+j', event)) {
      editor.log();
      event.preventDefault();
    } else {
      return next();
    }
  },
});

const plugins = [
  Logger(),
  /*
  SoftBreak({
    onlyIn: ['quote', 'code-block'],
  }),
  SoftBreak({
    onlyIn: ['paragraph'],
    shift: true,
  }),
  BackspaceCloseBlock({
    ignoreIn: [
      'table',
      'table-row',
      'table-cell',
    ],
  }),
  BreakToDefaultBlock({
    onlyIn: [
      'heading-one',
      'heading-two',
      'heading-three',
      'heading-four',
      'heading-five',
      'heading-six',
      'quote',
    ],
  }),
  */
  BreakToDefaultBlock(),
  ListPlugin(),
];

export default plugins;
