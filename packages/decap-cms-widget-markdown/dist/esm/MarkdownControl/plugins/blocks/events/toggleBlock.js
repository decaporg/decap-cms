"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _isCursorInBlockType = _interopRequireDefault(require("../locations/isCursorInBlockType"));
var _getListTypeAtCursor = _interopRequireDefault(require("../locations/getListTypeAtCursor"));
var _wrapListItemsInBlock = _interopRequireDefault(require("../transforms/wrapListItemsInBlock"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function toggleBlock(editor, type) {
  const {
    selection
  } = editor;
  if (!selection) return;
  const isHeading = type.startsWith('heading-');
  const isActive = (0, _isCursorInBlockType.default)(editor, type, isHeading, _slate.Range.isExpanded(selection));
  const listType = (0, _getListTypeAtCursor.default)(editor);

  // headings do not contain paragraphs so they could be converted, not wrapped/unwrapped
  if (isHeading) {
    _slate.Transforms.setNodes(editor, {
      type: isActive ? 'paragraph' : type
    });
    return;
  }
  const {
    focus,
    anchor
  } = selection;
  if (!isActive && listType && focus.path[focus.path.length - 3] != anchor.path[anchor.path.length - 3]) {
    return (0, _wrapListItemsInBlock.default)(editor, type, listType);
  }
  if (!isActive) {
    return _slate.Transforms.wrapNodes(editor, {
      type
    });
  }
  _slate.Transforms.unwrapNodes(editor, {
    match: n => n.type === type
  });
  return;
}
var _default = toggleBlock;
exports.default = _default;