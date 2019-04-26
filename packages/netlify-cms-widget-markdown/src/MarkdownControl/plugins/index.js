import { Text, Inline } from 'slate';
import { getEventRange, getEventTransfer, setEventTransfer } from 'slate-react';
import isHotkey from 'is-hotkey';
import ListPlugin from './ListPlugin';

const DEFAULT_BLOCK_TYPE = 'paragraph';
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

/*
const Drag = () => ({
  onDragOver(e) {
    e.preventDefault();
  },
  onDragStart(event, editor, next) {
    console.log(editor.value);
    console.log(editor.value.startBlock);
    // if a void node is being dragged, nothing is selected right now, no way
    // to get a hold of the dragged node
    setEventTransfer(event, 'node', editor.value.startBlock);
  },
  onDrop(event, editor, next) {
    const target = getEventRange(event, editor);
    const transfer = getEventTransfer(event);
    console.log(transfer);
    console.log(node);
    if (target) {
      editor.select(target);
    }
  },
});
*/

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
  ListPlugin({
    defaultBlockType: DEFAULT_BLOCK_TYPE,
    unorderedListType: 'bulleted-list',
    orderedListType: 'numbered-list',
  }),
];

export default plugins;
