import { Editor, Range, Transforms } from 'slate';

import isCursorInEmptyParagraph from './locations/isCursorInEmptyParagraph';

async function insertShortcode(editor, pluginConfig, cmsContext = {}) {
  if (pluginConfig.type === 'inline') {
    let selectedText = '';
    if (editor.selection && Range.isRange(editor.selection)) {
      selectedText = Editor.string(editor, editor.selection);
    }

    let shortcodeData = {};

    if (typeof pluginConfig.onInsert === 'function') {
      try {
        const result = await pluginConfig.onInsert({ selectedText, cmsContext });
        if (result === null || result === undefined) {
          return;
        }
        shortcodeData = result;
      } catch (err) {
        console.error(`Error in onInsert for inline component '${pluginConfig.id}':`, err);
        return;
      }
    } else if (pluginConfig.fields) {
      const defaultValues = pluginConfig.fields
        .toMap()
        .mapKeys((_, field) => field.get('name'))
        .map(field => field.get('default', ''));
      shortcodeData = defaultValues.toJS();
    }

    const nodeData = {
      type: 'inline-shortcode',
      id: pluginConfig.id,
      data: {
        shortcode: pluginConfig.id,
        shortcodeNew: true,
        shortcodeData,
        isVoid: pluginConfig.isVoid !== false,
      },
      children: [{ text: '' }],
    };

    Transforms.insertNodes(editor, nodeData);
    return;
  }

  const defaultValues = pluginConfig.fields
    ? pluginConfig.fields
        .toMap()
        .mapKeys((_, field) => field.get('name'))
        .map(field => field.get('default', ''))
        .toJS()
    : {};

  const nodeData = {
    type: 'shortcode',
    id: pluginConfig.id,
    data: {
      shortcode: pluginConfig.id,
      shortcodeNew: true,
      shortcodeData: defaultValues,
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
