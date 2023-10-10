"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  properties: {
    format: {
      type: 'string'
    },
    date_format: {
      oneOf: [{
        type: 'string'
      }, {
        type: 'boolean'
      }]
    },
    time_format: {
      oneOf: [{
        type: 'string'
      }, {
        type: 'boolean'
      }]
    },
    picker_utc: {
      type: 'boolean'
    }
  }
};
exports.default = _default;