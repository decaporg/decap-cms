"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _matchLink = _interopRequireDefault(require("../../matchers/matchLink"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getActiveLink(editor) {
  const [link] = _slate.Editor.nodes(editor, (0, _matchLink.default)(editor));
  return link;
}
var _default = getActiveLink;
exports.default = _default;