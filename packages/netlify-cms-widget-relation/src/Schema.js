export default {
  properties: {
    collection: { type: 'string' },
    valueField: { type: 'string' },
    searchFields: { type: 'array', items: { type: 'string' } },
    file: { type: 'string' },
    multiple: { type: 'boolean' },
    displayFields: { type: 'array', items: { type: 'string' } },
    optionsLength: { type: 'integer' },
  },
};
