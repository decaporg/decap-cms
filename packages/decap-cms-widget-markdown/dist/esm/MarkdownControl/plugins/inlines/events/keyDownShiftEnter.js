"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function keyDownShiftEnter(editor) {
  if (!editor.selection) return;
  const focus = {
    path: [...editor.selection.focus.path.slice(0, -1), editor.selection.focus.path[editor.selection.focus.path.length - 1] + 2],
    offset: 0
  };
  _slate.Transforms.insertNodes(editor, {
    type: 'break',
    children: [{
      text: ''
    }]
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
  _slate.Transforms.select(editor, focus);
  return false;
}
var _default = keyDownShiftEnter;
exports.default = _default;