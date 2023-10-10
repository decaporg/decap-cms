"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _liftFirstMatchedParent = _interopRequireDefault(require("./liftFirstMatchedParent"));
var _wrapFirstMatchedParent = _interopRequireDefault(require("./wrapFirstMatchedParent"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function convertParagraphToListItem(editor) {
  _slate.Editor.withoutNormalizing(editor, () => {
    // wrap the paragraph in a list item
    (0, _wrapFirstMatchedParent.default)(editor, 'paragraph', {
      type: 'list-item'
    });
    // lift the new list-item of the current list-item, split if necessary
    (0, _liftFirstMatchedParent.default)(editor, 'list-item', {
      split: true
    });
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
}
var _default = convertParagraphToListItem;
exports.default = _default;