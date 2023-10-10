"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _keyDown = _interopRequireDefault(require("./events/keyDown"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withInlines(editor) {
  const {
    isInline,
    isVoid
  } = editor;
  editor.isInline = element => ['link', 'button', 'break', 'image'].includes(element.type) || isInline(element);
  editor.isVoid = element => ['break', 'image', 'thematic-break'].includes(element.type) || isVoid(element);
  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => (0, _keyDown.default)(event, editor));
  return editor;
}
var _default = withInlines;
exports.default = _default;