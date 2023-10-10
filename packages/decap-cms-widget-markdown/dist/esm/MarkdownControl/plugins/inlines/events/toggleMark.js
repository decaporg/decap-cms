"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _isMarkActive = _interopRequireDefault(require("../locations/isMarkActive"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function toggleMark(editor, format) {
  if ((0, _isMarkActive.default)(editor, format)) {
    _slate.Editor.removeMark(editor, format);
  } else {
    _slate.Editor.addMark(editor, format, true);
  }
}
var _default = toggleMark;
exports.default = _default;