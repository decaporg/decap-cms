import { Map, fromJS } from 'immutable';
import { createPlateEditor, ParagraphPlugin } from 'platejs/react';

import image from '../../../../decap-cms-editor-component-image/src';
import { markdownToSlate, slateToMarkdown } from '../../serializers';
import { mergeMediaConfig } from '../mergeMediaConfig';
import ListPlugin from '../plugins/ListPlugin';
import ShortcodePlugin from '../plugins/ShortcodePlugin';

describe('VisualEditor', () => {
  it('should preserve block images inside list items', () => {
    const markdown = `1. First step.
2. Last step.

   ![Screenshot](/img/screenshot.png)`;
    const editorComponents = Map({ image });
    const value = markdownToSlate(markdown, { editorComponents });
    const editor = createPlateEditor({
      plugins: [ParagraphPlugin, ListPlugin, ShortcodePlugin],
      shouldNormalizeEditor: true,
      value,
    });

    expect(slateToMarkdown(editor.children, {}, editorComponents)).toEqual(markdown);
  });

  describe('mergeMediaConfig', () => {
    it('should copy editor media settings to image component', () => {
      const editorComponents = Map({
        image: {
          id: 'image',
          label: 'Image',
          type: 'shortcode',
          icon: 'exclamation-triangle',
          widget: 'object',
          pattern: {},
          fields: fromJS([
            {
              label: 'Image',
              name: 'image',
              widget: 'image',
              media_library: { allow_multiple: false },
            },
            { label: 'Alt Text', name: 'alt' },
            { label: 'Title', name: 'title' },
          ]),
        },
      });

      const field = fromJS({
        label: 'Body',
        name: 'body',
        widget: 'markdown',
        media_folder: '/{{media_folder}}/posts/images/widget/body',
        public_folder: '{{public_folder}}/posts/images/widget/body',
        media_library: { config: { max_file_size: 1234 } },
      });

      mergeMediaConfig(editorComponents, field);

      expect(editorComponents.get('image').fields).toEqual(
        fromJS([
          {
            label: 'Image',
            name: 'image',
            widget: 'image',
            media_library: { allow_multiple: false, config: { max_file_size: 1234 } },
            media_folder: '/{{media_folder}}/posts/images/widget/body',
            public_folder: '{{public_folder}}/posts/images/widget/body',
          },
          { label: 'Alt Text', name: 'alt' },
          { label: 'Title', name: 'title' },
        ]),
      );
    });
  });
});
