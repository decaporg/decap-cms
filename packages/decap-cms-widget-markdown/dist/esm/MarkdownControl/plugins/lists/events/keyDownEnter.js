"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _splitListItem = _interopRequireDefault(require("../transforms/splitListItem"));
var _isCursorAtListItemStart = _interopRequireDefault(require("../locations/isCursorAtListItemStart"));
var _liftListItem = _interopRequireDefault(require("../transforms/liftListItem"));
var _convertParagraphToListItem = _interopRequireDefault(require("../transforms/convertParagraphToListItem"));
var _isCursorAtNoninitialParagraphStart = _interopRequireDefault(require("../locations/isCursorAtNoninitialParagraphStart"));
var _splitToNestedList = _interopRequireDefault(require("../transforms/splitToNestedList"));
var _getListContainedInListItem = _interopRequireDefault(require("../selectors/getListContainedInListItem"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function keyDownEnter(editor) {
  if (!editor.selection) return;

  // Pressing enter will delete current selection in any case
  if (_slate.Range.isExpanded(editor.selection)) {
    _slate.Transforms.delete(editor);
  }

  // if edge of selection is in the begining of the first text node in list-item
  if ((0, _isCursorAtListItemStart.default)(editor)) {
    return (0, _liftListItem.default)(editor);
  }

  // if list has a nested list, insert new item to the beginning of the nested list
  const nestedList = (0, _getListContainedInListItem.default)(editor);
  if (!!nestedList && `${nestedList[0].type}`.endsWith('-list')) {
    return (0, _splitToNestedList.default)(editor, nestedList[0].type);
  }

  // if a paragraph in a list and has previous siblings, convert it to a list item
  if ((0, _isCursorAtNoninitialParagraphStart.default)(editor)) {
    return (0, _convertParagraphToListItem.default)(editor);
  }

  // otherwise create a new list item
  (0, _splitListItem.default)(editor);
}
var _default = keyDownEnter;
exports.default = _default;