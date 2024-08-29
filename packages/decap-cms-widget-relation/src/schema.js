export default {
  properties: {
    collection: { type: 'string' },
    value_field: { type: 'string' },
    search_fields: { type: 'array', minItems: 1, items: { type: 'string' } },
    file: { type: 'string' },
    multiple: { type: 'boolean' },
    min: { type: 'integer' },
    max: { type: 'integer' },
    display_fields: { type: 'array', minItems: 1, items: { type: 'string' } },
    options_length: { type: 'integer' },
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
  oneOf: [
    {
      required: ['collection', 'value_field', 'search_fields'],
    },
    {
      required: ['collection', 'valueField', 'searchFields'],
    },
  ],
};
