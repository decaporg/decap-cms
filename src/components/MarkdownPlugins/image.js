import React from 'react';

const image = {
  label: 'Image',
  id: 'image',
  fromBlock: match => match && {
    image: match[2],
    alt: match[1],
  },
  toBlock: data => `![${ data.alt || '' }](${ data.image || '' })`,
  toPreview: (data, getAsset) => <img src={getAsset(data.image) || ''} alt={data.alt || ''} />,
  pattern: /^!\[(.*)\]\((.*)\)$/,
  fields: [{
    label: 'Image',
    name: 'image',
    widget: 'image',
  }, {
    label: 'Alt Text',
    name: 'alt',
  }],
};

export default image;
