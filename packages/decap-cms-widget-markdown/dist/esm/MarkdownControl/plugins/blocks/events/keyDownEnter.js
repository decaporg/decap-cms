"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isCursorInBlockType = _interopRequireDefault(require("../locations/isCursorInBlockType"));
var _splitIntoParagraph = _interopRequireDefault(require("../transforms/splitIntoParagraph"));
var _unwrapIfCursorAtStart = _interopRequireDefault(require("../transforms/unwrapIfCursorAtStart"));
var _isCursorAtEndOfParagraph = _interopRequireDefault(require("../locations/isCursorAtEndOfParagraph"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function keyDownEnter(editor) {
  if (!editor.selection) return;
  if ((0, _isCursorInBlockType.default)(editor, 'heading', true)) {
    return handleHeading(editor);
  }
  return (0, _unwrapIfCursorAtStart.default)(editor);
}
function handleHeading(editor) {
  if ((0, _isCursorAtEndOfParagraph.default)(editor)) {
    // split into paragraph if cursor is at the end of heading
    (0, _splitIntoParagraph.default)(editor);
    return true;
  }
  return;
}
var _default = keyDownEnter;
exports.default = _default;