"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _keyDown = _interopRequireDefault(require("./events/keyDown"));
var _toggleBlock = _interopRequireDefault(require("./events/toggleBlock"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withBlocks(editor) {
  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => (0, _keyDown.default)(event, editor));
  editor.toggleBlock = type => (0, _toggleBlock.default)(editor, type);
  return editor;
}
var _default = withBlocks;
exports.default = _default;