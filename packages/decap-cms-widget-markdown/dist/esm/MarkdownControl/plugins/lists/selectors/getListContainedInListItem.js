"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getListContainedInListItem(editor) {
  if (!editor.selection) return false;
  const [, paragraphPath] = _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, 'paragraph'));
  return _slate.Editor.next(editor, {
    at: paragraphPath
  });
}
var _default = getListContainedInListItem;
exports.default = _default;