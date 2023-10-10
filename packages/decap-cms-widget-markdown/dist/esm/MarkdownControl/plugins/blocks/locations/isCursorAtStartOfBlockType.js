"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function isCursorAtStartOfBlockType(editor, type) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const block = _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, type));
  return !!block && _slate.Editor.isStart(editor, editor.selection.focus, block[1]);
}
var _default = isCursorAtStartOfBlockType;
exports.default = _default;