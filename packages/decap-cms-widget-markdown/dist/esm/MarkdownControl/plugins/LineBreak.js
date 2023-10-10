"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isHotkey = _interopRequireDefault(require("is-hotkey"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function LineBreak() {
  return {
    onKeyDown(event, editor, next) {
      const isShiftEnter = (0, _isHotkey.default)('shift+enter', event);
      if (!isShiftEnter) {
        return next();
      }
      return editor.insertInline('break').insertText('').moveToStartOfNextText();
    }
  };
}
var _default = LineBreak;
exports.default = _default;