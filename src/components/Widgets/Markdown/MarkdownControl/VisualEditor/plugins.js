import EditList from 'slate-edit-list';
import EditTable from 'slate-edit-table';

const SoftBreak = (options = {}) => ({
  onKeyDown(e, data, state) {
    if (data.key != 'enter') return;
    if (options.shift && e.shiftKey == false) return;

    const { onlyIn, ignoreIn, closeAfter, unwrapBlocks, defaultBlock = 'paragraph' } = options;
    const { type, nodes } = state.startBlock;
    if (onlyIn && !onlyIn.includes(type)) return;
    if (ignoreIn && ignoreIn.includes(type)) return;

    const shouldClose = nodes.last().characters.takeLast(closeAfter).every(c => c.text === '\n');
    if (closeAfter && shouldClose) {
      const trimmed = state.transform().deleteBackward(closeAfter);
      const unwrapped = unwrapBlocks
        ? unwrapBlocks.reduce((acc, blockType) => acc.unwrapBlock(blockType), trimmed)
        : trimmed;
      return unwrapped.insertBlock(defaultBlock).apply();
    }

    return state.transform().insertText('\n').apply();
  }
});

const SoftBreakOpts = {
  onlyIn: ['quote', 'code'],
  closeAfter: 1
};

export const SoftBreakConfigured = SoftBreak(SoftBreakOpts);

const BackspaceCloseBlock = (options = {}) => ({
  onKeyDown(e, data, state) {
    if (data.key != 'backspace') return;

    const { defaultBlock = 'paragraph', ignoreIn, onlyIn } = options;
    const { startBlock } = state;
    const { type } = startBlock;

    if (onlyIn && !onlyIn.includes(type)) return;
    if (ignoreIn && ignoreIn.includes(type)) return;

    const characters = startBlock.getFirstText().characters;
    const isEmpty = !characters || characters.isEmpty();

    if (isEmpty) {
      return state.transform().insertBlock(defaultBlock).focus().apply();
    }
  }
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

const EditListOpts = {
  types: ['bulleted-list', 'numbered-list'],
  typeItem: 'list-item',
};

export const EditListConfigured = EditList(EditListOpts);

const EditTableOpts = {
  typeTable: 'table',
  typeRow: 'table-row',
  typeCell: 'table-cell',
};

export const EditTableConfigured = EditTable(EditTableOpts);

const plugins = [
  SoftBreakConfigured,
  BackspaceCloseBlockConfigured,
  EditListConfigured,
  EditTableConfigured,
];

export default plugins;
