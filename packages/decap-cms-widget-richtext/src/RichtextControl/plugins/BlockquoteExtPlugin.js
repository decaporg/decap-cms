import { BlockquotePlugin } from '@udecode/plate-block-quote/react';
import {
  getBlockAbove,
  isAncestorEmpty,
  unwrapNodes,
  isFirstChild,
  isSelectionAtBlockStart,
} from '@udecode/plate-common';
import { createPlatePlugin, Key } from '@udecode/plate-common/react';

export const KEY_BLOCKQUOTE_EXIT_BREAK = 'blockquoteExitBreakPlugin';

function isWithinBlockquote(editor, entry) {
  const blockAbove = getBlockAbove(editor, { at: entry[1] });
  return blockAbove?.[0]?.type === BlockquotePlugin.key;
}

function queryNode(editor, entry, { empty, first, start }) {
  return (
    (!empty || isAncestorEmpty(editor, entry[0])) &&
    (!first || isFirstChild(entry[1])) &&
    (!start || isSelectionAtBlockStart(editor))
  );
}

function unwrap(editor) {
  unwrapNodes(editor, { split: true, match: n => n.type === BlockquotePlugin.key });
  return true;
}

function keyDownHandler({ editor, event, query }) {
  const entry = getBlockAbove(editor);
  if (!entry) return;

  if (isWithinBlockquote(editor, entry) && queryNode(editor, entry, query) && unwrap(editor)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

const BlockquoteExtPlugin = createPlatePlugin({
  key: KEY_BLOCKQUOTE_EXIT_BREAK,
  node: { isElement: true },
}).extend(() => ({
  shortcuts: {
    blockquoteEnter: {
      handler: handlerProps => keyDownHandler({ ...handlerProps, query: { empty: true } }),
      keys: [[Key.Enter]],
    },
    blockquoteBackspace: {
      handler: handlerProps =>
        keyDownHandler({ ...handlerProps, query: { first: true, start: true } }),
      keys: [[Key.Backspace]],
    },
  },
}));

export default BlockquoteExtPlugin;
