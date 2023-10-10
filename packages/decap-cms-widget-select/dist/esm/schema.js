"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  properties: {
    multiple: {
      type: 'boolean'
    },
    min: {
      type: 'integer'
    },
    max: {
      type: 'integer'
    },
    options: {
      type: 'array',
      items: {
        oneOf: [{
          type: 'string'
        }, {
          type: 'number'
        }, {
          type: 'object',
          properties: {
            label: {
              type: 'string'
            },
            value: {
              oneOf: [{
                type: 'string'
              }, {
                type: 'number'
              }]
            }
          },
          required: ['label', 'value']
        }]
      }
    }
  },
  required: ['options']
};
exports.default = _default;