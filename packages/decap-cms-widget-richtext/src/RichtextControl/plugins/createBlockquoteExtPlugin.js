import {
  createPluginFactory,
  getBlockAbove,
  isHotkey,
  isAncestorEmpty,
  unwrapNodes,
  isFirstChild,
  isSelectionAtBlockStart,
} from '@udecode/plate-common';
import { ELEMENT_BLOCKQUOTE } from '@udecode/plate-block-quote';

export const KEY_BLOCKQUOTE_EXIT_BREAK = 'blockquoteExitBreakPlugin';

function isWithinBlockquote(editor, entry) {
  const blockAbove = getBlockAbove(editor, { at: entry[1] });
  return blockAbove?.[0]?.type === ELEMENT_BLOCKQUOTE;
}

function queryNode(editor, entry, { empty, first, start }) {
  return (
    (!empty || isAncestorEmpty(editor, entry[0])) &&
    (!first || isFirstChild(entry[1])) &&
    (!start || isSelectionAtBlockStart(editor))
  );
}

function unwrap(editor) {
  unwrapNodes(editor, { split: true, match: n => n.type === ELEMENT_BLOCKQUOTE });
  return true;
}

function onKeyDownBlockquoteExitBreak(editor, { options: { rules } }) {
  return event => {
    if (event.defaultPrevented) return;

    const entry = getBlockAbove(editor);
    if (!entry) return;

    rules.forEach(({ hotkey, query }) => {
      if (
        isHotkey(hotkey, event) &&
        isWithinBlockquote(editor, entry) &&
        queryNode(editor, entry, query) &&
        unwrap(editor)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  };
}

const createBlockquoteExtPlugin = createPluginFactory({
  key: KEY_BLOCKQUOTE_EXIT_BREAK,
  handlers: {
    onKeyDown: onKeyDownBlockquoteExitBreak,
  },
  options: {
    rules: [
      { hotkey: 'enter', query: { empty: true } },
      { hotkey: 'backspace', query: { first: true, start: true } },
    ],
  },
});

export default createBlockquoteExtPlugin;
