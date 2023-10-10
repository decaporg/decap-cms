"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _getListContainedInListItem = _interopRequireDefault(require("../selectors/getListContainedInListItem"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function isCursorInItemContainingNestedList(editor) {
  const nestedList = (0, _getListContainedInListItem.default)(editor);
  return !!nestedList && `${nestedList[0].type}`.endsWith('-list');
}
var _default = isCursorInItemContainingNestedList;
exports.default = _default;