import { createSlatePlugin } from '@udecode/plate-common';
import { toPlatePlugin } from '@udecode/plate-common/react';

import ShortcodeElement from '../components/Element/ShortcodeElement';

const plugin = createSlatePlugin({
  key: 'shortcode',
  node: {
    isElement: true,
    isVoid: true,
    component: ShortcodeElement,
  },
});
const ShortcodePlugin = toPlatePlugin(plugin);

export default ShortcodePlugin;
