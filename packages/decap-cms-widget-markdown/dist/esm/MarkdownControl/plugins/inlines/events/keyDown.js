"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isHotkey = _interopRequireDefault(require("is-hotkey"));
var _toggleMark = _interopRequireDefault(require("./toggleMark"));
var _keyDownShiftEnter = _interopRequireDefault(require("./keyDownShiftEnter"));
var _toggleLink = _interopRequireDefault(require("./toggleLink"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MARK_HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+shift+s': 'delete',
  'mod+shift+c': 'code'
};
function keyDown(event, editor) {
  if (!editor.selection) return;
  for (const hotkey in MARK_HOTKEYS) {
    if ((0, _isHotkey.default)(hotkey, event)) {
      (0, _toggleMark.default)(editor, MARK_HOTKEYS[hotkey]);
      event.preventDefault();
      return false;
    }
  }
  if ((0, _isHotkey.default)('mod+k', event)) {
    event.preventDefault();
    return (0, _toggleLink.default)(editor);
  }
  if ((0, _isHotkey.default)('shift+enter', event)) {
    event.preventDefault();
    return (0, _keyDownShiftEnter.default)(editor);
  }
}
var _default = keyDown;
exports.default = _default;