import { createSlatePlugin } from 'platejs';
import { toPlatePlugin } from 'platejs/react';

const plugin = createSlatePlugin({
  key: 'image',
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
});

const ImagePlugin = toPlatePlugin(plugin);

export default ImagePlugin;
