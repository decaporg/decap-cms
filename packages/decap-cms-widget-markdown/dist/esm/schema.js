"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  properties: {
    minimal: {
      type: 'boolean'
    },
    buttons: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['bold', 'italic', 'code', 'link', 'heading-one', 'heading-two', 'heading-three', 'heading-four', 'heading-five', 'heading-six', 'quote', 'bulleted-list', 'numbered-list']
      }
    },
    editor_components: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    modes: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['raw', 'rich_text']
      },
      minItems: 1
    }
  }
};
exports.default = _default;