import { createPlatePlugin, Key } from 'platejs/react';

import BreakElement from '../components/Element/BreakElement';

const BreakPlugin = createPlatePlugin({
  key: 'break',
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
    component: BreakElement,
  },
  handlers: {
    onKeyDown: ({ editor, event }) => {
      // Handle shift+enter an only when there's a selection.
      if (event.key !== Key.Enter || !event.shiftKey || !editor.selection) {
        return;
      }

      editor.tf.insertNodes([{ type: 'break', children: [{ text: '' }] }, { text: '' }]);
      event.preventDefault();
      event.stopPropagation();
    },
  },
});

export default BreakPlugin;
