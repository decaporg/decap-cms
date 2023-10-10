"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _lowestMatchedAncestor = _interopRequireDefault(require("../../matchers/lowestMatchedAncestor"));
var _matchedAncestors = _interopRequireDefault(require("../../matchers/matchedAncestors"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function keyDownShiftTab(editor) {
  if (!editor.selection) return;
  if (Array.from(_slate.Editor.nodes(editor, (0, _matchedAncestors.default)(editor, 'list'))).length < 2) {
    return;
  }
  _slate.Editor.withoutNormalizing(editor, () => {
    _slate.Transforms.liftNodes(editor, _objectSpread(_objectSpread({}, (0, _lowestMatchedAncestor.default)(editor, 'list-item')), {}, {
      split: true
    }));
    _slate.Transforms.liftNodes(editor, _objectSpread(_objectSpread({}, (0, _lowestMatchedAncestor.default)(editor, 'list-item')), {}, {
      split: true
    }));
  });
  _slate.Editor.normalize(editor);
}
var _default = keyDownShiftTab;
exports.default = _default;