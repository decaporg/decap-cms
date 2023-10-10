"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isMarkActive(editor, format) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const marks = _slate.Editor.marks(editor);
  return marks ? marks[format] === true : false;
}
var _default = isMarkActive;
exports.default = _default;