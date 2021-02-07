import { Text, Block } from 'slate';

function createShortcodeBlock(shortcodeConfig) {
  // Handle code block component
  if (shortcodeConfig.type === 'code-block') {
    return Block.create({ type: shortcodeConfig.type, data: { shortcodeNew: true } });
  }

  const nodes = [Text.create('')];

  // Get default values for plugin fields.
  const defaultValues = shortcodeConfig.fields
    .toMap()
    .mapKeys((_, field) => field.get('name'))
    .filter(field => field.has('default'))
    .map(field => field.get('default'));

  // Create new shortcode block with default values set.
  return Block.create({
    type: 'shortcode',
    data: {
      shortcode: shortcodeConfig.id,
      shortcodeNew: true,
      shortcodeData: defaultValues,
    },
    nodes,
  });
}

function Shortcode({ defaultType }) {
  return {
    commands: {
      insertShortcode(editor, shortcodeConfig) {
        const block = createShortcodeBlock(shortcodeConfig);
        const { focusBlock } = editor.value;

        if (focusBlock.text === '' && focusBlock.type === defaultType) {
          editor.replaceNodeByKey(focusBlock.key, block);
        } else {
          editor.insertBlock(block);
        }

        editor.focus();
      },
    },
  };
}

export default Shortcode;
