export default {
  properties: {
    multiple: { type: 'boolean' },
    min: { type: 'integer' },
    max: { type: 'integer' },
    options: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
        ],
      },
    },
  },
  required: ['options'],
};
