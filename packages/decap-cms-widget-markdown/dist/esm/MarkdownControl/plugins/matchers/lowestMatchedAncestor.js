"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _matchedAncestors = _interopRequireDefault(require("./matchedAncestors"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function lowestMatchedAncestor(editor, format) {
  return (0, _matchedAncestors.default)(editor, format, 'lowest');
}
var _default = lowestMatchedAncestor;
exports.default = _default;