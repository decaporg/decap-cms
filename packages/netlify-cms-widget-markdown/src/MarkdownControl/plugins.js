import { Text, Inline, Range } from 'slate';
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

const BreakToDefaultBlock = ({ onlyIn = [], defaultBlock = 'paragraph' }) => ({
  onKeyDown(event, editor, next) {
    const block = editor.value.startBlock;
    const isEnter = isHotkey('enter', event) || isHotkey('shift+enter', event);
    if (!isEnter || editor.value.selection.isExpanded) return next();
    if (onlyIn.includes(editor.value.startBlock.type)) {
      editor.insertBlock(defaultBlock);
    } else {
      return next();
    }
  },
});

const BreakToAdditionalBlock = ({ onlyIn = [], defaultBlock = 'paragraph' }) => ({
  onKeyDown(event, editor, next) {
  },
});

const BackspaceCloseBlock = (options = {}) => ({
  onKeyDown(event, editor, next) {
    if (event.key !== 'Backspace') return next();

    const { defaultBlock = 'paragraph', ignoreIn = [], onlyIn} = options;
    const { value } = editor;
    const { startBlock, document: doc } = value;
    const { type,  key } = startBlock;

    if (
      value.selection.isExpanded
      || (onlyIn && !onlyIn.includes(type))
      || ignoreIn.includes(type)
      || !value.selection.start.isAtStartOfNode(startBlock)
    ) {
      return next();
    }

    const parent = doc.getParent(key);
    const grandparent = doc.getParent(parent.key);

    if (parent.type === 'quote') {
      editor.unwrapBlock(parent.type).focus();
      return next();
    }
    if (parent.type === 'list-item') {
      editor.unwrapBlock(parent.type).unwrapBlock(grandparent.type);
      return next();
    }
    editor.setBlocks(defaultBlock).focus();
    return next();
  },
});

function assertType(node, type) {
  if (node.type !== type) {
    throw Error(`Expected node of type "${type}", received "${node.type}".`);
  }
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
    getCommonAncestor(editor) {
      return document.getCommonAncestor(editor.value.startBlock.key, editor.value.endBlock.key);
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
    isInList(editor) {
      return editor.getListContextNode().type === 'list-item';
    },
    getListItem(editor) {
      const listContextNode = editor.getListContextNode();
      if (listContextNode.type === 'list-item') {
        return listContextNode;
      }
    },
    isSelected(editor, node) {
      return editor.value.document.isNodeInRange(node.key, editor.value.selection);
    },
    getListContextNode(editor, node) {
      const targetTypes = ['bulleted-list', 'numbered-list', 'list-item', 'quote', 'table-cell'];
      const { startBlock, endBlock, selection, document } = editor.value;
      const target = node || (selection.isCollapsed && startBlock) || editor.getCommonAncestor();
      if (!target.type) {
        return target;
      }
      if (targetTypes.includes(target.type)) {
        return target;
      }
      return editor.getListContextNode(editor.value.document.getParent(target.key));
    },
    isFirstChild(editor, node) {
      return editor.value.document.getParent(node.key).nodes.first().key === node.key;
    },
  },
  commands: {
    wrapInList(editor, type) {
      editor.wrapBlock(type).wrapBlock('list-item');
    },
    unwrapListItem(editor, node) {
      assertType(node, 'list-item');
      editor
        .unwrapNodeByKey(node.key)
        .unwrapBlockByKey(node.key);
    },
    toggleListItemType(editor, listItem) {
      assertType(listItem, 'list-item');
      const newListType = list.type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list';
      const list = editor.value.document.getParent(listItem);

      // If list item is first child of list and list previous sibling is a list
      // of the type being toggled to, move the list item to the end of the
      // previous list.
      if (editor.isFirstChild(listItem)) {
        const listPreviousSibling = editor.value.document.getPreviousSibling(list.key);
        if (listPreviousSibling && listPreviousSibling.type === newListType) {
          editor.moveNodeByKey(listItem, listPreviousSibling, listPreviousSibling.nodes.size);
          return;
        };

        // Delete the list the node was moved from if empty.
        if (list.size === 1) {
          editor.removeNodeByKey(list.key);
        }
      }

      // Unwrap the list item from it's list and wrap in a new list of the
      // alternate type.
      editor
        .unwrapNodeByKey(listItem.key)
        .wrapBlockByKey(listItem.key, type);
    },
    toggleList(editor, type) {
      /**
       * 1. Get the common ancestor - if selection is collapsed, use `startBlock`
       * 2. If it's a list and it's a different type than the type received, change the list type
       * 3. If it's a list, and it's the same as the received type, split the list items included
       *    in the selection out of the list, which will dissolve the list if no list items remain.
       * 4. If it's a list item and the list is a different type than the type received, nest
       *    the selected blocks into a new list item and list of the new type
       * 5. If it's a list item, and it's the same type, unwrap the list item one level through it's
       *    parent and then unwrap (remove) the list item itself
       * 6. If it's a non-list type that can contain lists, create a new list and list item
       *    containing the selected blocks, as usual.
       * 7. If it's something else, get it's parent and run it through the above steps.
       * 8. If you go back to root and still haven't found a block that can contain lists or a list,
       *    wrap the top
       */
      if (!LIST_TYPES.includes(type)) {
        throw Error(`${type} is not a valid list type, must be one of: ${LIST_TYPES}`);
      }
      const { startBlock, endBlock } = editor.value;
      const target = editor.getListContextNode();

      switch (target.type) {
        case 'bulleted-list':
        case 'numbered-list': {
          const list = target;
          if (list.type !== type) {
            editor.setBlock(list.key, type);
          } else {
            list.nodes.forEach(listItem => {
              if (editor.isSelected(listItem)) {
                editor.unwrapListItem(listItem);
              }
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

        case 'quote':
        case 'table-cell':
        case undefined: {
          editor.wrapInList(type);
          break;
        }
      }
    },
    unwrapNodeToDepth(editor, key, depth) {
      let currentDepth = 0;
      while (currentDepth < depth) {
        editor.unwrapNodeByKey(key);
        currentDepth += 1;
      }
    },
  },
  onKeyDown(event, editor, next) {
    /**
     * Handle `Tab`
     */
    const isTab = isHotkey('tab', event);
    const isShiftTab = isHotkey('shift+tab', event);
    if (isTab || isShiftTab) {
      event.preventDefault();
      const listItem = editor.getCurrentListItem();
      if (!listItem) {
        return next();
      }
      const list = editor.value.document.getParent(listItem.key);
      if (isTab) {
        const previousListItem = editor.value.document.getPreviousSibling(listItem.key);

        // Don't indent the first item of a list.
        if (!previousListItem) {
          return next();
        }

        const previousNestedList = previousListItem.nodes.last();
        if (previousNestedList && previousNestedList.type === list.type) {
          editor.moveNodeByKey(listItem.key, previousNestedList.key, previousListItem.nodes.size);
        } else {
          // Wrap the current list item into a new list-item/list tree, then
          // merge the new list-item/list tree into it's previous sibling.
          editor
            .wrapBlockByKey(listItem.key, 'list-item')
            .wrapBlockByKey(listItem.key, list.type);
          const newAncestorListItem = editor.getClosestType(listItem.key, 'list-item');
          editor.mergeNodeByKey(newAncestorListItem.key);
        }
      } else if (isShiftTab) {
        const parentList = editor.value.document.getParent(list.key);
        if (parentList.type !== 'list-item') {
          return next();
        }
        editor.unwrapNodeToDepth(listItem.key, 2);
      }
    }

    /**
     * Handle `Enter`
     */
    else if (isHotkey('enter', event)) {
      if (!editor.isInList()) {
        return next();
      }

      if (editor.value.selection.isExpanded) {
        editor.delete();
      }

      // If the list item is empty, remove it.
      if (parentBlock.text === '') {
        editor.unwrapNodeToDepth(block.key, 2);
      }

      else if (
        block.text === '' ||
        !editor.value.selection.start.isAtStartOfNode(parentBlock) &&
        editor.value.selection.start.isAtStartOfNode(block)
      ) {
        editor.unwrapNodeByKey(block.key).wrapBlockByKey(block.key, 'list-item');
      }

        /*
        const previousSibling = editor.value.document.getPreviousSibling(block.key);
        if (previousSibling && previousSibling.text === '') {
          const newParent = editor.value.document.getParent(block.key);
          if (LIST_TYPES.includes(newParent.type)) {
            editor
              .unwrapNodeByKey(block.key)
              .wrapBlock('list-item');
          }
        }
        */
      else {
        return next();
      }
        /*
      else {
        editor
          .splitBlockAtRange(editor.value.selection)
          .setNodeByKey(editor.value.startBlock.key, DEFAULT_BLOCK_TYPE);
      }
      */
    }

    else {
      return next();
    }
  },
});

const Logger = () => ({
  commands: {
    log(editor) {
      console.log(JSON.stringify(editor.value.toJS(), null, 2));
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
  SoftBreak({
    onlyIn: ['quote', 'code'],
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
  ListPlugin(),
];

export default plugins;
