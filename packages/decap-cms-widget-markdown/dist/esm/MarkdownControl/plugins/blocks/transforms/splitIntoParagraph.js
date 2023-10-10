"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function splitIntoParagraph(editor) {
  _slate.Editor.withoutNormalizing(editor, () => {
    _slate.Transforms.splitNodes(editor, {
      always: true
    });
    _slate.Transforms.setNodes(editor, {
      type: 'paragraph'
    });
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
  return true;
}
var _default = splitIntoParagraph;
exports.default = _default;