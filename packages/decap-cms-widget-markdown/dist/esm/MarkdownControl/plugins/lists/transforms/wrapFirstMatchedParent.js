"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function wrapFirstMatchedParent(editor, format, node) {
  _slate.Transforms.wrapNodes(editor, node, (0, _lowestMatchedAncestor.default)(editor, format));
}
var _default = wrapFirstMatchedParent;
exports.default = _default;