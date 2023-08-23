import { Map, fromJS } from 'immutable';

import { mergeMediaConfig } from '../VisualEditor';

describe('VisualEditor', () => {
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
