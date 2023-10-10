"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _unwrapIfCursorAtStart = _interopRequireDefault(require("../transforms/unwrapIfCursorAtStart"));
var _isCursorAtStartOfNonEmptyHeading = _interopRequireDefault(require("../locations/isCursorAtStartOfNonEmptyHeading"));
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
var _areCurrentAndPreviousBlocksOfType = _interopRequireDefault(require("../locations/areCurrentAndPreviousBlocksOfType"));
var _isCursorAtStartOfBlockType = _interopRequireDefault(require("../locations/isCursorAtStartOfBlockType"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function keyDownBackspace(editor) {
  if (!editor.selection) return;
  if ((0, _isCursorAtStartOfNonEmptyHeading.default)(editor)) {
    return;
  }
  if ((0, _isCursorAtStartOfBlockType.default)(editor, 'quote') && (0, _areCurrentAndPreviousBlocksOfType.default)(editor, 'quote')) {
    _slate.Transforms.mergeNodes(editor, (0, _lowestMatchedAncestor.default)(editor, 'quote'));
    return true;
  }
  return (0, _unwrapIfCursorAtStart.default)(editor, true);
}
var _default = keyDownBackspace;
exports.default = _default;