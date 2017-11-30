import { Block, Text } from 'slate';
import { isHotkey } from 'is-hotkey';

export default onKeyDown;

/**
 * Minimal re-implementation of Slate's undo/redo functionality, but with focus
 * forced back into editor afterward.
 */
function changeHistory(change, type) {

  /**
   * Get the history for undo or redo (determined via `type` param).
   */
  const { history } = change.value;
  if (!history) return;
  const historyOfType = history[`${type}s`];

  /**
   * If there is a next history item to apply, and it's valid, apply it.
   */
  const next = historyOfType.first();
  const historyOfTypeIsValid = historyOfType.size > 1
    || ( next && next.length > 1 && next[0].type !== 'set_selection' );

  if (historyOfTypeIsValid) {
    change[type]();
  }

  /**
   * Always ensure focus is set.
   */
  return change.focus();
}

function onKeyDown(event, change) {
  const createDefaultBlock = () => {
    return Block.create({
      type: 'paragraph',
      nodes: [Text.create('')],
    });
  };

  if (event.key === 'Enter') {
    /**
     * If "Enter" is pressed while a single void block is selected, a new
     * paragraph should be added above or below it, and the current selection
     * (range) should be collapsed to the start of the new paragraph.
     *
     * If the selected block is the first block in the document, create the
     * new block above it. If not, create the new block below it.
     */
    const { document: doc, range, anchorBlock, focusBlock } = change.value;
    const singleBlockSelected = anchorBlock === focusBlock;
    if (!singleBlockSelected || !focusBlock.isVoid) return;

    event.preventDefault();

    const focusBlockParent = doc.getParent(focusBlock.key);
    const focusBlockIndex = focusBlockParent.nodes.indexOf(focusBlock);
    const focusBlockIsFirstChild = focusBlockIndex === 0;

    const newBlock = createDefaultBlock();
    const newBlockIndex = focusBlockIsFirstChild ? 0 : focusBlockIndex + 1;

    return change
      .insertNodeByKey(focusBlockParent.key, newBlockIndex, newBlock)
      .collapseToStartOf(newBlock);
  }

  if (isHotkey(`mod+${event.key}`, event)) {

    /**
     * Undo and redo work automatically with Slate, but focus is lost in certain
     * actions. We override Slate's built in undo/redo here and force focus
     * back to the editor each time.
     */
    if (event.key === 'y') {
      event.preventDefault();
      return changeHistory(change, 'redo');
    }

    if (event.key === 'z') {
      event.preventDefault();
      return changeHistory(change, event.isShift ? 'redo' : 'undo');
    }

    const marks = {
      b: 'bold',
      i: 'italic',
      u: 'underline',
      s: 'strikethrough',
      '`': 'code',
    };

    const mark = marks[event.key];

    if (mark) {
      event.preventDefault();
      return change.toggleMark(mark);
    }
  }
};
