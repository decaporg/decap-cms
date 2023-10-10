"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function defaultEmptyBlock(text = '') {
  return {
    type: 'paragraph',
    children: [{
      text
    }]
  };
}
var _default = defaultEmptyBlock;
exports.default = _default;