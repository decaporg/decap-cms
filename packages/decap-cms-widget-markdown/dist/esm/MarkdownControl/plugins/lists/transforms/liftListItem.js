"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _unwrapFirstMatchedParent = _interopRequireDefault(require("./unwrapFirstMatchedParent"));
var _liftFirstMatchedParent = _interopRequireDefault(require("./liftFirstMatchedParent"));
var _getLowestAncestorList = _interopRequireDefault(require("../selectors/getLowestAncestorList"));
var _getLowestAncestorQuote = _interopRequireDefault(require("../selectors/getLowestAncestorQuote"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function liftListItem(editor) {
  _slate.Editor.withoutNormalizing(editor, () => {
    // lift the paragraph out of the list and split if necessary
    (0, _liftFirstMatchedParent.default)(editor, 'list-item', {
      split: true
    });

    // if list is nested and not wrapped in quote, lift into the parent list, unwrap otherwise
    const parentList = (0, _getLowestAncestorList.default)(editor);
    const parentQuote = (0, _getLowestAncestorQuote.default)(editor);
    if (parentList && !parentQuote || parentList && parentQuote && parentList[1].length > parentQuote[1].length) {
      (0, _liftFirstMatchedParent.default)(editor, 'list-item', {
        split: true
      });
    } else {
      // unwrap the paragraph from list-item element
      (0, _unwrapFirstMatchedParent.default)(editor, 'list-item');
    }
  });
  _slate.Editor.normalize(editor, {
    force: true
  });
}
var _default = liftListItem;
exports.default = _default;