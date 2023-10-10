"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  properties: {
    decimals: {
      type: 'integer'
    },
    type: {
      type: 'string',
      enum: ['Point', 'LineString', 'Polygon']
    }
  }
};
exports.default = _default;