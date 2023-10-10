"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isCursorInBlockType(editor, type, ignoreHeadings, ignoreLists) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const [match] = Array.from(_slate.Editor.nodes(editor, {
    match: n => _slate.Element.isElement(n) && _slate.Editor.isBlock(editor, n) && n.type !== 'paragraph' && n.type !== 'list-item' && (ignoreHeadings || !`${n.type}`.startsWith('heading-')) && (!ignoreLists || !`${n.type}`.endsWith('-list')),
    mode: 'lowest'
  }));
  return !!match && (match[0].type === type || `${match[0].type}`.startsWith(`${type}-` || `${match[0].type}`.endsWith(`-${type}`)));
}
var _default = isCursorInBlockType;
exports.default = _default;