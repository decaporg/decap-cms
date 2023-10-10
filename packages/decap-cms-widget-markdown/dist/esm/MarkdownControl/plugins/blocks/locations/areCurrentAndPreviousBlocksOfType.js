"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function areCurrentAndPreviousBlocksOfType(editor, type) {
  const {
    selection
  } = editor;
  if (!selection) return false;
  const [current] = _slate.Editor.nodes(editor, (0, _lowestMatchedAncestor.default)(editor, 'block'));
  const previous = _slate.Editor.previous(editor, (0, _lowestMatchedAncestor.default)(editor, type));
  return current && previous && current[0].type === previous[0].type;
}
var _default = areCurrentAndPreviousBlocksOfType;
exports.default = _default;