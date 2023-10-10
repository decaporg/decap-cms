"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getLowestAncestorQuote(editor) {
  if (!editor.selection) return false;
  return _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, 'quote'));
}
var _default = getLowestAncestorQuote;
exports.default = _default;