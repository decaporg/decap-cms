"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isHotkey = _interopRequireDefault(require("is-hotkey"));
var _keyDownEnter = _interopRequireDefault(require("./keyDownEnter"));
var _keyDownBackspace = _interopRequireDefault(require("./keyDownBackspace"));
var _isCursorInNonDefaultBlock = _interopRequireDefault(require("../locations/isCursorInNonDefaultBlock"));
var _toggleBlock = _interopRequireDefault(require("./toggleBlock"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const HEADING_HOTKEYS = {
  'mod+1': 'heading-one',
  'mod+2': 'heading-two',
  'mod+3': 'heading-three',
  'mod+4': 'heading-four',
  'mod+5': 'heading-five',
  'mod+6': 'heading-six'
};
function keyDown(event, editor) {
  if (!editor.selection) return;
  for (const hotkey in HEADING_HOTKEYS) {
    if ((0, _isHotkey.default)(hotkey, event)) {
      (0, _toggleBlock.default)(editor, HEADING_HOTKEYS[hotkey]);
      event.preventDefault();
      return false;
    }
  }
  if (!(0, _isCursorInNonDefaultBlock.default)(editor)) return;
  if ((0, _isHotkey.default)('enter', event)) {
    const eventIntercepted = (0, _keyDownEnter.default)(editor);
    if (eventIntercepted) {
      event.preventDefault();
      return false;
    }
  }
  if ((0, _isHotkey.default)('backspace', event)) {
    const eventIntercepted = (0, _keyDownBackspace.default)(editor);
    if (eventIntercepted) {
      event.preventDefault();
      return false;
    }
  }
}
var _default = keyDown;
exports.default = _default;