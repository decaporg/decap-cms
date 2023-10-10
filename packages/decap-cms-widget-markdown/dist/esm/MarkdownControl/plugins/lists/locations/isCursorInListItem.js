"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isCursorInListItem(editor, immediate) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const [match] = Array.from(_slate.Editor.nodes(editor, {
    match: n => _slate.Element.isElement(n) && _slate.Editor.isBlock(editor, n) && n.type !== 'paragraph' && (immediate || !`${n.type}`.startsWith('heading-')),
    mode: 'lowest'
  }));
  return !!match && match[0].type === 'list-item';
}
var _default = isCursorInListItem;
exports.default = _default;