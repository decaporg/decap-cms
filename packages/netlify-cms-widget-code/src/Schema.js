export default {
  properties: {
    default_language: { type: 'string' },
    allow_language_selection: { type: 'boolean' },
    output_code_only: { type: 'boolean' },
    keys: {
      type: 'object',
      properties: { code: { type: 'string' }, lang: { type: 'string' } },
    },
  },
};
