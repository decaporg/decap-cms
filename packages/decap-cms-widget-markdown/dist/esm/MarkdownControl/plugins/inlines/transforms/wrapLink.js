"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _getActiveLink = _interopRequireDefault(require("../selectors/getActiveLink"));
var _matchLink = _interopRequireDefault(require("../../matchers/matchLink"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function wrapLink(editor, url) {
  if ((0, _getActiveLink.default)(editor)) {
    _slate.Transforms.setNodes(editor, {
      data: {
        url
      }
    }, (0, _matchLink.default)());
    return;
  }
  const {
    selection
  } = editor;
  const isCollapsed = selection && _slate.Range.isCollapsed(selection);
  const link = {
    type: 'link',
    data: {
      url
    },
    children: isCollapsed ? [{
      text: url
    }] : []
  };
  if (isCollapsed) {
    _slate.Transforms.insertNodes(editor, link);
  } else {
    _slate.Transforms.wrapNodes(editor, link, {
      split: true
    });
    _slate.Transforms.collapse(editor, {
      edge: 'end'
    });
  }
}
var _default = wrapLink;
exports.default = _default;