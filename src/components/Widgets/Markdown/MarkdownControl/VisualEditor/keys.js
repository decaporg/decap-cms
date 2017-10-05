import { Block, Text } from 'slate';

export default onKeyDown;

/**
 * Minimal re-implementation of Slate's undo/redo functionality, but with focus
 * forced back into editor afterward.
 */
function changeHistory(change, type) {

  /**
   * Get the history for undo or redo (determined via `type` param).
   */
  const { history } = change.state;
  if (!history) return;
  const historyOfType = history[`${type}s`];

  /**
   * If there is a next history item to apply, and it's valid, apply it.
   */
  const next = historyOfType.first();
  const historyOfTypeIsValid = historyOfType.size > 1
    || next.length > 1
    || next[0].type !== 'set_selection';

  if (next && historyOfTypeIsValid) {
    change[type]();
  }

  /**
   * Always ensure focus is set.
   */
  return change.focus();
}

function onKeyDown(e, data, change) {
  const createDefaultBlock = () => {
    return Block.create({
      type: 'paragraph',
      nodes: [Text.create('')],
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
    const { document: doc, selection, anchorBlock, focusBlock } = change.state;
    const singleBlockSelected = anchorBlock === focusBlock;
    if (!singleBlockSelected || !focusBlock.isVoid) return;

    e.preventDefault();

    const focusBlockParent = doc.getParent(focusBlock.key);
    const focusBlockIndex = focusBlockParent.nodes.indexOf(focusBlock);
    const focusBlockIsFirstChild = focusBlockIndex === 0;

    const newBlock = createDefaultBlock();
    const newBlockIndex = focusBlockIsFirstChild ? 0 : focusBlockIndex + 1;

    return change
      .insertNodeByKey(focusBlockParent.key, newBlockIndex, newBlock)
      .collapseToStartOf(newBlock);
  }

  if (data.isMod) {

    /**
     * Undo and redo work automatically with Slate, but focus is lost in certain
     * actions. We override Slate's built in undo/redo here and force focus
     * back to the editor each time.
     */
    if (data.key === 'y') {
      e.preventDefault();
      return changeHistory(change, 'redo');
    }

    if (data.key === 'z') {
      e.preventDefault();
      return changeHistory(change, data.isShift ? 'redo' : 'undo');
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
      return change.toggleMark(mark);
    }
  }
};
