"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function isSelectionWithinNoninitialListItem(editor) {
  if (!editor.selection) return false;
  const [, path] = _slate.Editor.above(editor, {
    match: n => n.type === 'list-item',
    mode: 'lowest',
    at: _slate.Range.start(editor.selection)
  });
  if (path && path.length > 0 && path[path.length - 1] > 0) return true;
}
var _default = isSelectionWithinNoninitialListItem;
exports.default = _default;