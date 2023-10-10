"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function moveListToListItem(editor, listPath, targetListItem) {
  const [targetItem, targetPath] = targetListItem;

  // move the node to the last child position of the parent node
  _slate.Transforms.moveNodes(editor, {
    at: listPath,
    to: [...targetPath, targetItem.children.length]
  });
}
var _default = moveListToListItem;
exports.default = _default;