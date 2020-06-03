export default {
  properties: {
    format: { type: 'string' },
    dateFormat: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    timeFormat: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    pickerUtc: { type: 'boolean' },
  },
};
