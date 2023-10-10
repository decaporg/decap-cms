"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function mergeWithPreviousListItem(editor) {
  _slate.Editor.withoutNormalizing(editor, () => {
    _slate.Transforms.mergeNodes(editor, (0, _lowestMatchedAncestor.default)(editor, 'list-item'));
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
}
var _default = mergeWithPreviousListItem;
exports.default = _default;