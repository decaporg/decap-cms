export default {
  properties: {
    minimal: { type: 'boolean' },
    buttons: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'bold',
          'italic',
          'code',
          'link',
          'heading-one',
          'heading-two',
          'heading-three',
          'heading-four',
          'heading-five',
          'heading-six',
          'quote',
          'bulleted-list',
          'numbered-list',
        ],
      },
    },
    editorComponents: { type: 'array', items: { type: 'string' } },
  },
};
