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
          { type: 'number' },
          {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { oneOf: [{ type: 'string' }, { type: 'number' }] },
            },
            required: ['label', 'value'],
          },
        ],
      },
    },
    filters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          values: { type: 'array', minItems: 1, items: { type: ['string', 'boolean', 'integer'] } },
        },
        required: ['field', 'values'],
      },
    },
  },
  required: ['options'],
};
