"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getListTypeAtCursor(editor) {
  const list = _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, 'list'));
  if (!list) return null;
  return list[0].type;
}
var _default = getListTypeAtCursor;
exports.default = _default;