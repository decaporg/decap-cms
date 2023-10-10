"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _keyDown = _interopRequireDefault(require("./events/keyDown"));
var _moveListToListItem = _interopRequireDefault(require("./transforms/moveListToListItem"));
var _toggleListType = _interopRequireDefault(require("./events/toggleListType"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withLists(editor) {
  const {
    normalizeNode
  } = editor;
  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => (0, _keyDown.default)(event, editor));
  editor.toggleList = type => (0, _toggleListType.default)(editor, type);
  editor.isListItem = () => {
    const {
      selection
    } = editor;
    if (!selection) return false;
    const [match] = Array.from(_slate.Editor.nodes(editor, {
      at: _slate.Editor.unhangRange(editor, selection),
      match: n => !_slate.Editor.isEditor(n) && _slate.Element.isElement(n) && _slate.Editor.isBlock(editor, n) && n.type !== 'paragraph' && !`${n.type}`.startsWith('heading-'),
      mode: 'lowest'
    }));
    return !!match && match[0].type === 'list-item';
  };
  editor.normalizeNode = entry => {
    normalizeNode(entry);
    const [node, path] = entry;
    let previousType = null;
    if (_slate.Element.isElement(node) || _slate.Editor.isEditor(node)) {
      for (const [child, childPath] of _slate.Node.children(editor, path)) {
        if (`${child.type}`.endsWith('-list') && child.type === previousType) {
          _slate.Transforms.mergeNodes(editor, {
            at: childPath
          });
          break;
        }
        previousType = child.type;
      }
    }
    if (_slate.Element.isElement(node) && `${node.type}`.endsWith('-list')) {
      const previousNode = _slate.Editor.previous(editor, {
        at: path
      });
      const [parentNode, parentNodePath] = _slate.Editor.parent(editor, path);
      if (!previousNode && parentNode.type === 'list-item') {
        const previousListItem = _slate.Editor.previous(editor, {
          at: parentNodePath
        });
        (0, _moveListToListItem.default)(editor, path, previousListItem);
        _slate.Transforms.removeNodes(editor, {
          at: parentNodePath
        });
      }
    }
  };
  return editor;
}
var _default = withLists;
exports.default = _default;