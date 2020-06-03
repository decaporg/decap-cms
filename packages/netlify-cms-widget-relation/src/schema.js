export default {
  properties: {
    collection: { type: 'string' },
    valueField: { type: 'string' },
    searchFields: { type: 'array', minItems: 1, items: { type: 'string' } },
    file: { type: 'string' },
    multiple: { type: 'boolean' },
    displayFields: { type: 'array', minItems: 1, items: { type: 'string' } },
    optionsLength: { type: 'integer' },
  },
  required: ['collection', 'valueField', 'searchFields'],
};
