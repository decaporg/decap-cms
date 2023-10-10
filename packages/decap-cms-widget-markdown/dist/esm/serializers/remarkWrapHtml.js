"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remarkWrapHtml;
var _unistBuilder = _interopRequireDefault(require("unist-builder"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Ensure that top level 'html' type nodes are wrapped in paragraphs. Html nodes
 * are used for text nodes that we don't want Remark or Rehype to parse.
 */
function remarkWrapHtml() {
  function transform(tree) {
    tree.children = tree.children.map(node => {
      if (node.type === 'html') {
        return (0, _unistBuilder.default)('paragraph', [node]);
      }
      return node;
    });
    return tree;
  }
  return transform;
}