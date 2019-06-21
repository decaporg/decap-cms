import isHotkey from 'is-hotkey';
import { SLATE_DEFAULT_BLOCK_TYPE } from '../../types';

const createShortcodeBlock = shortcodeConfig => {
  // Handle code block component
  if (plugin.type === 'code-block') {
    return { type: plugin.type };
  }

  const nodes = [Text.create('')];

  /**
   * Get default values for plugin fields.
   */
  const defaultValues = shortcodeConfig.fields
    .toMap()
    .mapKeys((_, field) => field.get('name'))
    .filter(field => field.has('default'))
    .map(field => field.get('default'));

  /**
   * Create new shortcode block with default values set.
   */
  return {
    object: 'block',
    type: 'shortcode',
    data: {
      shortcode: shortcodeConfig.id,
      shortcodeNew: true,
      shortcodeData: defaultValues,
    },
    nodes,
  };
};

const Shortcode = () => ({
  commands: {
    insertShortcode(editor, shortcodeConfig) {
      const block = createShortcodeBlock(shortcodeConfig);
      const { focusBlock } = this.editor.value;

      if (focusBlock.text === '' && focusBlock.type === 'paragraph') {
        this.editor.setNodeByKey(focusBlock.key, block);
      } else {
        this.editor.insertBlock(block);
      }

      this.editor.focus();
    },
  },
});

export default Shortcode;
