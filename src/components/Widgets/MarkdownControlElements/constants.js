export const emptyParagraphBlock = {
  nodes: [
    {
      kind: 'block',
      type: 'paragraph',
      nodes: [{
        kind: 'text',
        ranges: [{
          text: '',
        }],
      }],
    },
  ],
};

export const mediaproxyBlock = mediaproxy => ({
  kind: 'block',
  type: 'paragraph',
  nodes: [{
    kind: 'inline',
    type: 'mediaproxy',
    isVoid: true,
    data: {
      alt: mediaproxy.name,
      src: mediaproxy.public_path,
    },
  }],
});
