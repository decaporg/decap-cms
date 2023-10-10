"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isHotkey = _interopRequireDefault(require("is-hotkey"));
var _keyDownEnter = _interopRequireDefault(require("./keyDownEnter"));
var _keyDownTab = _interopRequireDefault(require("./keyDownTab"));
var _keyDownShiftTab = _interopRequireDefault(require("./keyDownShiftTab"));
var _keyDownBackspace = _interopRequireDefault(require("./keyDownBackspace"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function keyDown(event, editor) {
  if (!editor.isListItem()) return;
  if ((0, _isHotkey.default)('enter', event)) {
    event.preventDefault();
    (0, _keyDownEnter.default)(editor);
    return false;
  }
  if ((0, _isHotkey.default)('backspace', event)) {
    const eventIntercepted = (0, _keyDownBackspace.default)(editor);
    if (eventIntercepted === false) {
      event.preventDefault();
      return false;
    }
    return;
  }
  if ((0, _isHotkey.default)('tab', event)) {
    event.preventDefault();
    return (0, _keyDownTab.default)(editor);
  }
  if ((0, _isHotkey.default)('shift+tab', event)) {
    event.preventDefault();
    return (0, _keyDownShiftTab.default)(editor);
  }
}
var _default = keyDown;
exports.default = _default;