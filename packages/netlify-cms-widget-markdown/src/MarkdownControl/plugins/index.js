//import { Text, Inline } from 'slate';
import isHotkey from 'is-hotkey';
import CommandsAndQueries from './CommandsAndQueries';
import ListPlugin from './ListPlugin';

const DEFAULT_BLOCK_TYPE = 'paragraph';
/*
const BLOCK_PARENTS = [
  'list-item',
  'quote',
];
*/
const LineBreak = (options = {}) => ({
  onKeyDown(event, editor, next) {
    const isShiftEnter = isHotkey('shift+enter', event);
    if (!isShiftEnter) {
      return next();
    }
    return editor
      .insertInline('break')
      .insertText('')
      .moveToStartOfNextText();
  },
});

const BreakToDefaultBlock = () => ({
  onKeyDown(event, editor, next) {
    const { selection, startBlock } = editor.value;
    const isEnter = isHotkey('enter', event);
    if (!isEnter) {
      return next();
    }
    if (selection.isExpanded) {
      editor.delete();
      return next();
    }
    if (selection.start.isAtEndOfNode(startBlock) && startBlock.type !== DEFAULT_BLOCK_TYPE) {
      return editor.insertBlock(DEFAULT_BLOCK_TYPE);
    }
    return next();
  },
});

const CloseBlock = () => ({
  onKeyDown(event, editor, next) {
    const { selection, startBlock } = editor.value;
    const isBackspace = isHotkey('backspace', event);
    if (!isBackspace) {
      return next();
    }
    if (selection.isExpanded) {
      return editor.delete();
    }
    if (!selection.start.isAtStartOfNode(startBlock) || startBlock.text.length > 0) {
      return next();
    }
    if (startBlock.type !== DEFAULT_BLOCK_TYPE) {
      return editor.setBlocks(DEFAULT_BLOCK_TYPE);
    }
    return next();
  },
});

const QuoteBlock = () => ({
  onKeyDown(event, editor, next) {
    const isBackspace = isHotkey('backspace', event);
    const { selection, startBlock, document: doc } = editor.value;
    if (!isBackspace) {
      return next();
    }
    if (selection.isExpanded) {
      return editor.delete();
    }
    if (!selection.start.isAtStartOfNode(startBlock)) {
      return next();
    }
    if (startBlock.type === DEFAULT_BLOCK_TYPE && doc.getParent(startBlock.key).type === 'quote' ) {
      return editor.unwrapNodeByKey(startBlock.key);
    }
    return next();
  },
});

const SelectAll = () => ({
  onKeyDown(event, editor, next) {
    const isModA = isHotkey('mod+a', event);
    if (!isModA) {
      return next();
    }
    event.preventDefault();
    return editor.moveToRangeOfDocument();
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
      console.log(JSON.stringify(editor.value.toJS(), null, 2));
      console.log(JSON.stringify(editor.value.selection.toJS(), null, 2));
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
  Logger(),
  CommandsAndQueries(),
  QuoteBlock(),
  ListPlugin({
    defaultBlockType: DEFAULT_BLOCK_TYPE,
    unorderedListType: 'bulleted-list',
    orderedListType: 'numbered-list',
  }),
  LineBreak(),
  BreakToDefaultBlock(),
  CloseBlock(),
  SelectAll(),
];

export default plugins;
