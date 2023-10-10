"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _isSelectionWithinNoninitialListItem = _interopRequireDefault(require("../locations/isSelectionWithinNoninitialListItem"));
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
var _moveListToListItem = _interopRequireDefault(require("../transforms/moveListToListItem"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function keyDownTab(editor) {
  if (!editor.selection) return;
  if (!(0, _isSelectionWithinNoninitialListItem.default)(editor)) return;

  // In a case where one edge of the range is within a nested list item, we need to even the selection to the outer most level
  const {
    focus,
    anchor
  } = editor.selection;
  const pathLength = focus.path.length > anchor.path.length ? anchor.path.length : focus.path.length;
  const at = {
    anchor: {
      offset: 0,
      path: [...anchor.path.slice(0, pathLength - 2), 0, 0]
    },
    focus: {
      offset: 0,
      path: [...focus.path.slice(0, pathLength - 2), 0, 0]
    }
  };
  _slate.Editor.withoutNormalizing(editor, () => {
    // wrap selected list items into a new bulleted list
    _slate.Transforms.wrapNodes(editor, {
      type: 'bulleted-list'
    }, _objectSpread(_objectSpread({}, (0, _lowestMatchedAncestor.default)(editor, 'list-item')), {}, {
      at
    }));

    // get the new bulleted list position
    const [, newListPath] = _slate.Editor.above(editor, (0, _lowestMatchedAncestor.default)(editor, 'list'));

    // get the new parent node (previous list item)
    const parentNode = _slate.Editor.previous(editor, {
      at: newListPath
    });
    (0, _moveListToListItem.default)(editor, newListPath, parentNode);
  });
  _slate.Editor.normalize(editor);
}
var _default = keyDownTab;
exports.default = _default;