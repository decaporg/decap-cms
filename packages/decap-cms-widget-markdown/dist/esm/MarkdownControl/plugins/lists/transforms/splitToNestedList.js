"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _wrapFirstMatchedParent = _interopRequireDefault(require("./wrapFirstMatchedParent"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function splitToNestedList(editor, listType) {
  if (!editor.selection) return false;
  if (_slate.Range.isExpanded(editor.selection)) {
    _slate.Transforms.delete(editor);
  }
  _slate.Editor.withoutNormalizing(editor, () => {
    // split even if at the end of current text
    _slate.Transforms.splitNodes(editor, {
      always: true
    });
    // set the new node to paragraph (to avoid splitting headings)
    _slate.Transforms.setNodes(editor, {
      type: 'paragraph'
    });
    // wrap the paragraph in a list item
    (0, _wrapFirstMatchedParent.default)(editor, 'paragraph', {
      type: 'list-item'
    });
    (0, _wrapFirstMatchedParent.default)(editor, 'list-item', {
      type: listType
    });
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
}
var _default = splitToNestedList;
exports.default = _default;