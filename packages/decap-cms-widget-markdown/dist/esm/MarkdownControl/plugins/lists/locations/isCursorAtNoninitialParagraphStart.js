"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isCursorAtNoninitialParagraphStart(editor) {
  if (!editor.selection) return false;
  const {
    offset,
    path
  } = _slate.Range.start(editor.selection);
  return offset == 0 && path.length > 2 && path[path.length - 2] > 0;
}
var _default = isCursorAtNoninitialParagraphStart;
exports.default = _default;