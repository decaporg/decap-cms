"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _defaultEmptyBlock = _interopRequireDefault(require("../blocks/defaultEmptyBlock"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withShortcodes(editor) {
  const {
    isVoid,
    normalizeNode
  } = editor;
  editor.isVoid = element => {
    return element.type === 'shortcode' ? true : isVoid(element);
  };

  // Prevent empty editor after deleting shortcode theat was only child
  editor.normalizeNode = entry => {
    const [node] = entry;
    if (_slate.Editor.isEditor(node) && node.children.length == 0) {
      _slate.Transforms.insertNodes(editor, (0, _defaultEmptyBlock.default)());
    }
    normalizeNode(entry);
  };
  return editor;
}
var _default = withShortcodes;
exports.default = _default;