export default {
  properties: {
    decimals: { type: 'integer' },
    type: { type: 'string', enum: ['Point', 'LineString', 'Polygon'] },
  },
};
