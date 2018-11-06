import { Text, Inline } from 'slate';
import isHotkey from 'is-hotkey';

const SoftBreak = (options = {}) => ({
  onKeyDown(event, editor) {
    if (options.shift && !isHotkey('shift+enter', event)) return;
    if (!options.shift && !isHotkey('enter', event)) return;

    const { onlyIn, ignoreIn, defaultBlock = 'paragraph' } = options;
    const { type, text } = editor.value.startBlock;
    if (onlyIn && !onlyIn.includes(type)) return;
    if (ignoreIn && ignoreIn.includes(type)) return;

    const shouldClose = text.endsWith('\n');
    if (shouldClose) {
      return editor.deleteBackward(1).insertBlock(defaultBlock);
    }

    const textNode = Text.create('\n');
    const breakNode = Inline.create({ type: 'break', nodes: [textNode] });
    return editor
      .insertInline(breakNode)
      .insertText('')
      .moveToStartOfNextText();
  },
});

const SoftBreakOpts = {
  onlyIn: ['quote', 'code'],
};

export const SoftBreakConfigured = SoftBreak(SoftBreakOpts);

export const ParagraphSoftBreakConfigured = SoftBreak({ onlyIn: ['paragraph'], shift: true });

const BreakToDefaultBlock = ({ onlyIn = [], defaultBlock = 'paragraph' }) => ({
  onKeyDown(event, editor) {
    const { value } = editor;
    if (!isHotkey('enter', event) || value.isExpanded) return;
    if (onlyIn.includes(value.startBlock.type)) {
      return editor.insertBlock(defaultBlock);
    }
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
  onKeyDown(event, editor) {
    if (event.key !== 'Backspace') return;

    const { defaultBlock = 'paragraph', ignoreIn, onlyIn } = options;
    const { startBlock } = editor.value;
    const { type } = startBlock;

    if (onlyIn && !onlyIn.includes(type)) return;
    if (ignoreIn && ignoreIn.includes(type)) return;

    if (startBlock.text === '') {
      return editor.setBlocks(defaultBlock).focus();
    }
  },
});

const BackspaceCloseBlockOpts = {
  ignoreIn: [
    'paragraph',
    'list-item',
    'bulleted-list',
    'numbered-list',
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
