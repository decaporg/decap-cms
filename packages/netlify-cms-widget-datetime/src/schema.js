export default {
  properties: {
    format: { type: 'string' },
    date_format: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    time_format: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    picker_utc: { type: 'boolean' },
  },
};
