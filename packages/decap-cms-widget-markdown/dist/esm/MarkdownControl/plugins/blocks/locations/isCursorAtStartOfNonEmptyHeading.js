"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isCursorAtStartOfNonEmptyHeading(editor) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const [match] = Array.from(_slate.Editor.nodes(editor, {
    match: n => _slate.Element.isElement(n) && _slate.Editor.isBlock(editor, n) && `${n.type}`.startsWith('heading-'),
    mode: 'lowest'
  }));
  return !!match && _slate.Editor.isStart(editor, editor.selection.focus, match[1]) && !_slate.Editor.isEmpty(editor, match[0]);
}
var _default = isCursorAtStartOfNonEmptyHeading;
exports.default = _default;