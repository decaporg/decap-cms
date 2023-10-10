"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isCursorInListItem = _interopRequireDefault(require("../locations/isCursorInListItem"));
var _getLowestAncestorList = _interopRequireDefault(require("../selectors/getLowestAncestorList"));
var _wrapSelectionInList = _interopRequireDefault(require("../transforms/wrapSelectionInList"));
var _changeListType = _interopRequireDefault(require("../transforms/changeListType"));
var _unwrapSelectionFromList = _interopRequireDefault(require("../transforms/unwrapSelectionFromList"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function toggleListType(editor, type) {
  // list being active means that we are in a paragraph or heading whose parent is a list
  // if no list is active, wrap selection in a new list of the given type
  if (!(0, _isCursorInListItem.default)(editor)) {
    return (0, _wrapSelectionInList.default)(editor, type);
  }
  // if a list is active but the type doesn't match, change selection to the given list type
  const currentList = (0, _getLowestAncestorList.default)(editor);
  if (currentList && currentList[0].type !== type) {
    return (0, _changeListType.default)(editor, type);
  }

  // if a list is active and the type matches, unwrap selection from the list
  return (0, _unwrapSelectionFromList.default)(editor);
}
var _default = toggleListType;
exports.default = _default;