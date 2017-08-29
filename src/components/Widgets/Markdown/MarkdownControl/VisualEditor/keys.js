import { Block, Text } from 'slate';

export default onKeyDown;

function onKeyDown(e, data, state) {
  const createDefaultBlock = () => {
    return Block.create({
      type: 'paragraph',
      nodes: [Text.createFromString('')]
    });
  };
  if (data.key === 'enter') {
    /**
     * If "Enter" is pressed while a single void block is selected, a new
     * paragraph should be added above or below it, and the current selection
     * should be collapsed to the start of the new paragraph.
     *
     * If the selected block is the first block in the document, create the
     * new block above it. If not, create the new block below it.
     */
    const { document: doc, selection, anchorBlock, focusBlock } = state;
    const singleBlockSelected = anchorBlock === focusBlock;
    if (!singleBlockSelected || !focusBlock.isVoid) return;

    e.preventDefault();

    const focusBlockParent = doc.getParent(focusBlock.key);
    const focusBlockIndex = focusBlockParent.nodes.indexOf(focusBlock);
    const focusBlockIsFirstChild = focusBlockIndex === 0;

    const newBlock = createDefaultBlock();
    const newBlockIndex = focusBlockIsFirstChild ? 0 : focusBlockIndex + 1;

    return state.transform()
      .insertNodeByKey(focusBlockParent.key, newBlockIndex, newBlock)
      .collapseToStartOf(newBlock)
      .apply();
  }

  if (data.isMod) {

    if (data.key === 'y') {
      e.preventDefault();
      return state.transform().redo().focus().apply({ save: false });
    }

    if (data.key === 'z') {
      e.preventDefault();
      return state.transform()[data.isShift ? 'redo' : 'undo']().focus().apply({ save: false });
    }

    const marks = {
      b: 'bold',
      i: 'italic',
      u: 'underlined',
      s: 'strikethrough',
      '`': 'code',
    };

    const mark = marks[data.key];

    if (mark) {
      e.preventDefault();
      return state.transform().toggleMark(mark).apply();
    }
  }
};
