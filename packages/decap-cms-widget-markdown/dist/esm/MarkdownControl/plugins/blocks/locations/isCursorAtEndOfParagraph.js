"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function isCursorAtEndOfParagraph(editor) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const paragraph = _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, 'paragraph'));
  return !!paragraph && _slate.Editor.isEnd(editor, editor.selection.focus, paragraph[1]);
}
var _default = isCursorAtEndOfParagraph;
exports.default = _default;