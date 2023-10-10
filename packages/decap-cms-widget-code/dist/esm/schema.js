"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  properties: {
    default_language: {
      type: 'string'
    },
    allow_language_selection: {
      type: 'boolean'
    },
    output_code_only: {
      type: 'boolean'
    },
    keys: {
      type: 'object',
      properties: {
        code: {
          type: 'string'
        },
        lang: {
          type: 'string'
        }
      }
    }
  }
};
exports.default = _default;