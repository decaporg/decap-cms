"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function wrapListItemsInBlock(editor, blockType, listType) {
  _slate.Editor.withoutNormalizing(editor, () => {
    _slate.Transforms.wrapNodes(editor, {
      type: listType
    });
    _slate.Transforms.wrapNodes(editor, {
      type: blockType
    }, {
      match: n => n.type === listType
    });
    _slate.Transforms.liftNodes(editor, {
      match: n => n.type === blockType
    });
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
}
var _default = wrapListItemsInBlock;
exports.default = _default;