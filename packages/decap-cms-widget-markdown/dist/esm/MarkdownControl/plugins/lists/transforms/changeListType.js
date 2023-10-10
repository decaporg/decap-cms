"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function changeListType(editor, type) {
  _slate.Editor.withoutNormalizing(editor, () => {
    // wrap selected list items into new type
    _slate.Transforms.wrapNodes(editor, {
      type
    }, (0, _lowestMatchedAncestor.default)(editor, 'list-item'));
    // lift the new list of the current list, split if necessary
    _slate.Transforms.liftNodes(editor, (0, _lowestMatchedAncestor.default)(editor, type));
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
}
var _default = changeListType;
exports.default = _default;