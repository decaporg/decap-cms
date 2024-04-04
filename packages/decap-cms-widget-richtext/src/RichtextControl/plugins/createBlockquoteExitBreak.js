import {
  createPluginFactory,
  getBlockAbove,
  isHotkey,
  isAncestorEmpty,
  unwrapNodes,
  isFirstChild,
} from '@udecode/plate-common';
import { ELEMENT_BLOCKQUOTE } from '@udecode/plate-block-quote';

export const KEY_BLOCKQUOTE_EXIT_BREAK = 'blockquoteExitBreakPlugin';

function isWithinBlockquote(editor, entry) {
  const blockAbove = getBlockAbove(editor, { at: entry[1] });
  return blockAbove?.[0]?.type === ELEMENT_BLOCKQUOTE;
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

    rules.forEach(({ hotkey, isFirstParagraph }) => {
      if (
        isHotkey(hotkey, event) &&
        isAncestorEmpty(editor, entry[0]) &&
        isWithinBlockquote(editor, entry) &&
        (!isFirstParagraph || isFirstChild(entry[1])) &&
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
    rules: [{ hotkey: 'enter' }, { hotkey: 'backspace', isFirstParagraph: true }],
  },
});

export default createBlockquoteExtPlugin;
