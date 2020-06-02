export default {
  string: {
    properties: {
      name: { type: 'string' },
      label: { type: 'string' },
      widget: { type: 'string' },
      required: { type: 'boolean' },
      hint: { type: 'string' },
      pattern: { type: 'array', minItems: 2, items: { type: 'string' } },
    },
  },
};
