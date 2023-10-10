"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isCursorInNonDefaultBlock(editor) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const [match] = Array.from(_slate.Editor.nodes(editor, {
    match: n => _slate.Element.isElement(n) && _slate.Editor.isBlock(editor, n) && n.type !== 'paragraph',
    mode: 'lowest'
  }));
  return !!match && !_slate.Editor.isEditor(match[0]);
}
var _default = isCursorInNonDefaultBlock;
exports.default = _default;