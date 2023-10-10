"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function matchedAncestors(editor, format, mode) {
  return {
    match: n => !_slate.Editor.isEditor(n) && _slate.Element.isElement(n) && _slate.Editor.isBlock(editor, n) && (n.type === format || format === 'heading' && `${n.type}`.startsWith('heading-') || format === 'paragraph' && `${n.type}`.startsWith('heading-') || format === 'block' && !`${n.type}`.startsWith('heading-') && n.type !== 'paragraph' || format === 'list' && `${n.type}`.endsWith('-list')) || format === 'non-default' && n.type !== 'paragraph',
    mode
  };
}
var _default = matchedAncestors;
exports.default = _default;