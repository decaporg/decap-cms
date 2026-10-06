import React from 'react';

import type { EditorComponentOptions } from './types';

/**
 * The built-in "Image" editor component: a markdown image
 * (`![alt](src "title")`) edited through an image picker plus alt text and
 * title fields. Upstream ships it as `decap-cms-editor-component-image` and
 * the app registers it by default, so richtext fields can insert images
 * without any setup.
 */
const imageEditorComponent: EditorComponentOptions = {
  label: 'Image',
  id: 'image',
  icon: 'image',
  pattern: /^!\[([^\]]*)\]\((.*?)(\s"([^"]*)")?\)/,
  fromBlock: match => ({
    image: match[2],
    alt: match[1],
    title: match[4],
  }),
  toBlock: ({ alt, image, title }) =>
    `![${(alt as string) || ''}](${(image as string) || ''}${
      title ? ` "${(title as string).replace(/"/g, '\\"')}"` : ''
    })`,
  toPreview: ({ alt, image, title }, getAsset, fields) => {
    const imageField = fields?.find(f => f.widget === 'image');
    // Without a getAsset (e.g. rendering markdown outside the editor) the
    // stored path is the best source there is.
    const src = getAsset ? getAsset(image as string, imageField) : image;
    return <img src={src ? String(src) : ''} alt={(alt as string) || ''} title={(title as string) || ''} />;
  },
  fields: [
    {
      label: 'Image',
      name: 'image',
      widget: 'image',
      media_library: {
        allow_multiple: false,
      },
    },
    {
      label: 'Alt Text',
      name: 'alt',
    },
    {
      label: 'Title',
      name: 'title',
    },
  ],
};

export default imageEditorComponent;
