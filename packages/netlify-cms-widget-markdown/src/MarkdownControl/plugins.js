import { Text, Inline, Range } from 'slate';
import isHotkey from 'is-hotkey';

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
        return next();
      }

      const textNode = Text.create('\n');
      const breakNode = Inline.create({ type: 'break', nodes: [textNode] });
      editor
        .insertInline(breakNode)
        .insertText('')
        .moveToStartOfNextText();

      return next();
    }
  },
});

const BreakToDefaultBlock = ({ onlyIn = [], defaultBlock = 'paragraph' }) => ({
  onKeyDown(event, editor, next) {
    const block = editor.value.startBlock;
    if (!isHotkey('enter', event) || editor.value.isExpanded) return next();
    if (onlyIn.includes(editor.value.startBlock.type)) {
      editor.insertBlock(defaultBlock);
    }
    return next();
  },
});

const BreakToAdditionalBlock = ({ onlyIn = [], defaultBlock = 'paragraph' }) => ({
  onKeyDown(event, editor, next) {
    const { type: blockType, text, key } = editor.value.startBlock;
    const { type: parentType, parentKey } = editor.value.document.getParent(key);
    const targetParentBlock = BLOCK_PARENTS.includes(parentType);
    const type = targetParentBlock ? parentType : blockType;
    if (onlyIn && !onlyIn.includes(type)) return next();
    if (ignoreIn && ignoreIn.includes(type)) return next();
    const type = getTargetType({ block: editor.value.startBlock, onlyIn });
    if (!type) {
      return next();
    }

    const block = editor.value.startBlock;
    if (!isHotkey('enter', event) || editor.value.isExpanded) return next();
    if (onlyIn.includes(block.type)) {
      editor.insertBlock(block.type);
    }
    return next();
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

    if (type === defaultBlock && parent.type === 'quote') {
      editor.unwrapBlock(parent.type).focus();
      return next();
    }
    if (type === defaultBlock && parent.type === 'list-item') {
      editor.unwrapBlock(parent.type).unwrapBlock(grandparent.type);
      return next();
    }
    if (type !== defaultBlock) {
      editor.setBlocks(defaultBlock).focus();
      return next();
    }

    return next();
  },
});

function ListPlugin(options) {
  return {
    commands: {
      wrapList(editor, type) {
        editor.wrapBlock(type).wrapBlock('list-item');
      }
    },
  };
}

const plugins = [
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
  BreakToAdditionalBlock({
    onlyIn: ['list-item'],
  }),
  ListPlugin(),
];

export default plugins;
