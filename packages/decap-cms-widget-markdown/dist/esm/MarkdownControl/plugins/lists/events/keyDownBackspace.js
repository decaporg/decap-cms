"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _isCursorInListItem = _interopRequireDefault(require("../locations/isCursorInListItem"));
var _isSelectionWithinNoninitialListItem = _interopRequireDefault(require("../locations/isSelectionWithinNoninitialListItem"));
var _unwrapSelectionFromList = _interopRequireDefault(require("../transforms/unwrapSelectionFromList"));
var _mergeWithPreviousListItem = _interopRequireDefault(require("../transforms/mergeWithPreviousListItem"));
var _isCursorAtNoninitialParagraphStart = _interopRequireDefault(require("../locations/isCursorAtNoninitialParagraphStart"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function keyDownBackspace(editor) {
  if (!editor.selection) return;

  // ignore if selection is expanded, cursor is not at the beginning or not immediately in a list item, or cursor is at the beginning of a non-initial paragraph
  if (!_slate.Range.isCollapsed(editor.selection) || editor.selection.anchor.offset !== 0 || !(0, _isCursorInListItem.default)(editor, true) || (0, _isCursorAtNoninitialParagraphStart.default)(editor)) {
    return;
  }
  if ((0, _isSelectionWithinNoninitialListItem.default)(editor)) {
    (0, _mergeWithPreviousListItem.default)(editor);
  } else {
    (0, _unwrapSelectionFromList.default)(editor);
  }
  return false;
}
var _default = keyDownBackspace;
exports.default = _default;