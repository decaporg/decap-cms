import { createSlatePlugin } from 'platejs';
import { toPlatePlugin } from 'platejs/react';

import BreakElement from '../components/Element/BreakElement';

const plugin = createSlatePlugin({
  key: 'break',
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
    component: BreakElement,
  },
});

const BreakPlugin = toPlatePlugin(plugin);

export default BreakPlugin;
