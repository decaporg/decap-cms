"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function unwrapIfCursorAtStart(editor, mergeWithPrevious = false) {
  if (editor.selection.anchor.offset !== 0) return false;
  const node = _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, 'non-default'));
  if (node[1].length == 0) return false;
  const isHeading = `${node[0].type}`.startsWith('heading-');
  if (isHeading) {
    _slate.Transforms.setNodes(editor, {
      type: 'paragraph'
    });
    return false;
  }
  _slate.Editor.withoutNormalizing(editor, () => {
    _slate.Transforms.unwrapNodes(editor, {
      match: n => n.type === node[0].type,
      split: true
    });
    if (mergeWithPrevious) {
      _slate.Transforms.mergeNodes(editor);
    }
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
  return true;
}
var _default = unwrapIfCursorAtStart;
exports.default = _default;