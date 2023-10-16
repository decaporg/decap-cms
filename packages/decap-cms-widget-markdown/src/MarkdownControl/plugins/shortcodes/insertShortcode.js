import { Transforms } from 'slate';

import isCursorInEmptyParagraph from './locations/isCursorInEmptyParagraph';

function insertShortcode(editor, pluginConfig) {
  const defaultValues = pluginConfig.fields
    .toMap()
    .mapKeys((_, field) => field.get('name'))
    .filter(field => field.has('default'))
    .map(field => field.get('default'));

  const nodeData = {
    type: 'shortcode',
    id: pluginConfig.id,
    data: {
      shortcode: pluginConfig.id,
      shortcodeNew: true,
      shortcodeData: defaultValues.toJS(),
    },
    children: [{ text: '' }],
  };

  if (isCursorInEmptyParagraph(editor)) {
    Transforms.setNodes(editor, nodeData);
    return;
  }

  Transforms.insertNodes(editor, nodeData);
}

export default insertShortcode;
