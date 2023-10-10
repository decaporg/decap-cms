"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _getActiveLink = _interopRequireDefault(require("../selectors/getActiveLink"));
var _unwrapLink = _interopRequireDefault(require("../transforms/unwrapLink"));
var _wrapLink = _interopRequireDefault(require("../transforms/wrapLink"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function toggleLink(editor, promptText) {
  var _activeLink$, _activeLink$$data;
  const activeLink = (0, _getActiveLink.default)(editor);
  const activeUrl = activeLink ? (_activeLink$ = activeLink[0]) === null || _activeLink$ === void 0 ? void 0 : (_activeLink$$data = _activeLink$.data) === null || _activeLink$$data === void 0 ? void 0 : _activeLink$$data.url : '';
  const url = window.prompt(promptText, activeUrl);
  if (url == null) return;
  if (url === '') {
    (0, _unwrapLink.default)(editor);
    return;
  }
  (0, _wrapLink.default)(editor, url);
}
var _default = toggleLink;
exports.default = _default;