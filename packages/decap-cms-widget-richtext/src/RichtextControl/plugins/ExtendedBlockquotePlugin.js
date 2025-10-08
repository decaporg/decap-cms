import { BlockquotePlugin } from '@platejs/basic-nodes/react';
import { PathApi } from 'platejs';
import { createPlatePlugin, Key } from 'platejs/react';

function isWithinBlockquote(editor, entry) {
  const blockAbove = editor.api.block({ at: entry[1], above: true });
  return blockAbove?.[0]?.type === BlockquotePlugin.key;
}

function queryNode(editor, entry, { empty, first, start, collapsed }) {
  console.log('collapsed', editor.api.isCollapsed());
  return (
    (!empty || editor.api.isEmpty(entry[1])) &&
    (!first || !PathApi.hasPrevious(entry[1])) &&
    (!start || editor.api.isAt({ start: true })) &&
    (!collapsed || editor.api.isCollapsed())
  );
}

function unwrap(editor) {
  editor.tf.unwrapNodes({ split: true, match: n => n.type === BlockquotePlugin.key });
}

const ExtendedBlockquotePlugin = createPlatePlugin({
  key: 'blockquote',
  plugins: [BlockquotePlugin],
}).extendPlugin(BlockquotePlugin, {
  node: { isElement: true },
  handlers: {
    onKeyDown: ({ editor, event }) => {
      const entry = editor.api.block();
      if (!entry) return;
      if (!isWithinBlockquote(editor, entry)) return;

      const rules = [
        { key: Key.Enter, query: { empty: true } },
        { key: Key.Backspace, query: { first: true, start: true, collapsed: true } },
      ];

      for (const rule of rules) {
        if (event.key === rule.key && queryNode(editor, entry, rule.query)) {
          unwrap(editor);
          event.preventDefault();
          event.stopPropagation();
          break;
        }
      }
    },
  },
});

export default ExtendedBlockquotePlugin;
