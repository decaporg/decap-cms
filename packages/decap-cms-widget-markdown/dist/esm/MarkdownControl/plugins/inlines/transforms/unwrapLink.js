"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _matchLink = _interopRequireDefault(require("../../matchers/matchLink"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function unwrapLink(editor) {
  _slate.Transforms.unwrapNodes(editor, (0, _matchLink.default)());
}
var _default = unwrapLink;
exports.default = _default;