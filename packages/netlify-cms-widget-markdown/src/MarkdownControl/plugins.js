import { Text, Inline } from 'slate';
import isHotkey from 'is-hotkey';

const SoftBreak = (options = {}) => ({
  onKeyDown(event, editor, next) {
    if (options.shift && !isHotkey('shift+enter', event)) return next();
    if (!options.shift && !isHotkey('enter', event)) return next();

    const { onlyIn, ignoreIn, defaultBlock = 'paragraph' } = options;
    const { type, text } = editor.value.startBlock;
    if (onlyIn && !onlyIn.includes(type)) return next();
    if (ignoreIn && ignoreIn.includes(type)) return next();

    const shouldClose = text.endsWith('\n');
    if (shouldClose) {
      editor.deleteBackward(1).insertBlock(defaultBlock);
      return true;
    }

    const textNode = Text.create('\n');
    const breakNode = Inline.create({ type: 'break', nodes: [textNode] });
    editor
      .insertInline(breakNode)
      .insertText('')
      .moveToStartOfNextText();

    return true;
  },
});

const SoftBreakOpts = {
  onlyIn: ['quote', 'code'],
};

export const SoftBreakConfigured = SoftBreak(SoftBreakOpts);

export const ParagraphSoftBreakConfigured = SoftBreak({ onlyIn: ['paragraph'], shift: true });

const BreakToDefaultBlock = ({ onlyIn = [], defaultBlock = 'paragraph' }) => ({
  onKeyDown(event, editor, next) {
    const { value } = editor;
    if (!isHotkey('enter', event) || value.isExpanded) return next();
    if (onlyIn.includes(value.startBlock.type)) {
      editor.insertBlock(defaultBlock);
      return true;
    }
    return next();
  },
});

const BreakToDefaultBlockOpts = {
  onlyIn: [
    'heading-one',
    'heading-two',
    'heading-three',
    'heading-four',
    'heading-five',
    'heading-six',
  ],
};

export const BreakToDefaultBlockConfigured = BreakToDefaultBlock(BreakToDefaultBlockOpts);

const BackspaceCloseBlock = (options = {}) => ({
  onKeyDown(event, editor, next) {
    if (event.key !== 'Backspace') return next();

    const { defaultBlock = 'paragraph', ignoreIn = [], onlyIn} = options;
    const { value } = editor;
    const { startBlock, document: doc } = value;
    const { type, text, key } = startBlock;

    if (
      value.selection.isExpanded
      || (onlyIn && !onlyIn.includes(type))
      || ignoreIn.includes(type)
      || text !== ''
    ) {
      return next();
    }

    const parent = doc.getParent(key);
    const grandparent = doc.getParent(parent.key);

    if (type === defaultBlock && parent.type === 'list-item') {
      editor.unwrapBlock(parent.type).unwrapBlock(grandparent.type);
      return true;
    }
    if (type !== defaultBlock) {
      editor.setBlocks(defaultBlock).focus();
      return true;
    }

    return next();
  },
});

const BackspaceCloseBlockOpts = {
  ignoreIn: [
    'table',
    'table-row',
    'table-cell',
  ],
};

export const BackspaceCloseBlockConfigured = BackspaceCloseBlock(BackspaceCloseBlockOpts);

const plugins = [
  SoftBreakConfigured,
  ParagraphSoftBreakConfigured,
  BackspaceCloseBlockConfigured,
  BreakToDefaultBlockConfigured,
];

export default plugins;
