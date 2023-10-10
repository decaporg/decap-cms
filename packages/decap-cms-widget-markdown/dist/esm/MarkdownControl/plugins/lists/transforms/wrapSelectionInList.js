"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function wrapSelectionInList(editor, type) {
  _slate.Editor.withoutNormalizing(editor, () => {
    _slate.Transforms.wrapNodes(editor, {
      type
    });
    const listItems = _slate.Editor.nodes(editor, (0, _lowestMatchedAncestor.default)(editor, 'paragraph'));
    for (const listItem of listItems) {
      _slate.Transforms.wrapNodes(editor, {
        type: 'list-item'
      }, {
        at: listItem[1]
      });
    }
  });
  _slate.Editor.normalize(editor);
}
var _default = wrapSelectionInList;
exports.default = _default;