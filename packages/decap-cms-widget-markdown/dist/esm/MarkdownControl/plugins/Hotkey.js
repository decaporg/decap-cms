"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.HOT_KEY_MAP = void 0;
var _isHotkey = _interopRequireDefault(require("is-hotkey"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const HOT_KEY_MAP = {
  bold: 'mod+b',
  code: 'mod+shift+c',
  italic: 'mod+i',
  strikethrough: 'mod+shift+s',
  'heading-one': 'mod+1',
  'heading-two': 'mod+2',
  'heading-three': 'mod+3',
  'heading-four': 'mod+4',
  'heading-five': 'mod+5',
  'heading-six': 'mod+6',
  link: 'mod+k'
};
exports.HOT_KEY_MAP = HOT_KEY_MAP;
function Hotkey(key, fn) {
  return {
    onKeyDown(event, editor, next) {
      if (!(0, _isHotkey.default)(key, event)) {
        return next();
      }
      event.preventDefault();
      editor.command(fn);
    }
  };
}
var _default = Hotkey;
exports.default = _default;