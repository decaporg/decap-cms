"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _omit2 = _interopRequireDefault(require("lodash/omit"));
var _react = _interopRequireWildcard(require("react"));
var _core = require("@emotion/core");
var _immutable = require("immutable");
var _slateReact = require("slate-react");
var _slate = require("slate");
var _index = require("../index");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; } /* eslint-disable react/prop-types */
var _ref = process.env.NODE_ENV === "production" ? {
  name: "1xfnuhy-Shortcode",
  styles: "margin-top:0;margin-bottom:16px;&:first-of-type{margin-top:0;};label:Shortcode;"
} : {
  name: "1xfnuhy-Shortcode",
  styles: "margin-top:0;margin-bottom:16px;&:first-of-type{margin-top:0;};label:Shortcode;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9NYXJrZG93bkNvbnRyb2wvY29tcG9uZW50cy9TaG9ydGNvZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBbURrQiIsImZpbGUiOiIuLi8uLi8uLi8uLi9zcmMvTWFya2Rvd25Db250cm9sL2NvbXBvbmVudHMvU2hvcnRjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgcmVhY3QvcHJvcC10eXBlcyAqL1xuaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3NzIH0gZnJvbSAnQGVtb3Rpb24vY29yZSc7XG5pbXBvcnQgeyBmcm9tSlMgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IHsgb21pdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBSZWFjdEVkaXRvciwgdXNlU2xhdGUgfSBmcm9tICdzbGF0ZS1yZWFjdCc7XG5pbXBvcnQgeyBSYW5nZSwgVHJhbnNmb3JtcyB9IGZyb20gJ3NsYXRlJztcblxuaW1wb3J0IHsgZ2V0RWRpdG9yQ29udHJvbCwgZ2V0RWRpdG9yQ29tcG9uZW50cyB9IGZyb20gJy4uL2luZGV4JztcblxuZnVuY3Rpb24gU2hvcnRjb2RlKHByb3BzKSB7XG4gIGNvbnN0IGVkaXRvciA9IHVzZVNsYXRlKCk7XG4gIGNvbnN0IHsgZWxlbWVudCwgZGF0YUtleSA9ICdzaG9ydGNvZGVEYXRhJywgY2hpbGRyZW4gfSA9IHByb3BzO1xuICBjb25zdCBFZGl0b3JDb250cm9sID0gZ2V0RWRpdG9yQ29udHJvbCgpO1xuICBjb25zdCBwbHVnaW4gPSBnZXRFZGl0b3JDb21wb25lbnRzKCkuZ2V0KGVsZW1lbnQuZGF0YS5zaG9ydGNvZGUpO1xuICBjb25zdCBmaWVsZEtleXMgPSBbJ2lkJywgJ2Zyb21CbG9jaycsICd0b0Jsb2NrJywgJ3RvUHJldmlldycsICdwYXR0ZXJuJywgJ2ljb24nXTtcblxuICBjb25zdCBmaWVsZCA9IGZyb21KUyhvbWl0KHBsdWdpbiwgZmllbGRLZXlzKSk7XG4gIGNvbnN0IFt2YWx1ZSwgc2V0VmFsdWVdID0gdXNlU3RhdGUoZnJvbUpTKGVsZW1lbnQuZGF0YVtkYXRhS2V5XSkpO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZUNoYW5nZShmaWVsZE5hbWUsIHZhbHVlLCBtZXRhZGF0YSkge1xuICAgIGNvbnN0IHBhdGggPSBSZWFjdEVkaXRvci5maW5kUGF0aChlZGl0b3IsIGVsZW1lbnQpO1xuICAgIGNvbnN0IG5ld1Byb3BlcnRpZXMgPSB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIC4uLmVsZW1lbnQuZGF0YSxcbiAgICAgICAgW2RhdGFLZXldOiB2YWx1ZS50b0pTKCksXG4gICAgICAgIG1ldGFkYXRhLFxuICAgICAgfSxcbiAgICB9O1xuICAgIFRyYW5zZm9ybXMuc2V0Tm9kZXMoZWRpdG9yLCBuZXdQcm9wZXJ0aWVzLCB7XG4gICAgICBhdDogcGF0aCxcbiAgICB9KTtcbiAgICBzZXRWYWx1ZSh2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVGb2N1cygpIHtcbiAgICBjb25zdCBwYXRoID0gUmVhY3RFZGl0b3IuZmluZFBhdGgoZWRpdG9yLCBlbGVtZW50KTtcbiAgICBUcmFuc2Zvcm1zLnNlbGVjdChlZGl0b3IsIHBhdGgpO1xuICB9XG5cbiAgY29uc3QgcGF0aCA9IFJlYWN0RWRpdG9yLmZpbmRQYXRoKGVkaXRvciwgZWxlbWVudCk7XG4gIGNvbnN0IGlzU2VsZWN0ZWQgPVxuICAgIGVkaXRvci5zZWxlY3Rpb24gJiZcbiAgICBwYXRoICYmXG4gICAgUmFuZ2UuaXNSYW5nZShlZGl0b3Iuc2VsZWN0aW9uKSAmJlxuICAgIFJhbmdlLmluY2x1ZGVzKGVkaXRvci5zZWxlY3Rpb24sIHBhdGgpO1xuXG4gIHJldHVybiAoXG4gICAgIWZpZWxkLmlzRW1wdHkoKSAmJiAoXG4gICAgICA8ZGl2IG9uQ2xpY2s9e2hhbmRsZUZvY3VzfSBvbkZvY3VzPXtoYW5kbGVGb2N1c30+XG4gICAgICAgIDxFZGl0b3JDb250cm9sXG4gICAgICAgICAgY3NzPXtjc3NgXG4gICAgICAgICAgICBtYXJnaW4tdG9wOiAwO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTZweDtcblxuICAgICAgICAgICAgJjpmaXJzdC1vZi10eXBlIHtcbiAgICAgICAgICAgICAgbWFyZ2luLXRvcDogMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBgfVxuICAgICAgICAgIHZhbHVlPXt2YWx1ZX1cbiAgICAgICAgICBmaWVsZD17ZmllbGR9XG4gICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUNoYW5nZX1cbiAgICAgICAgICBpc0VkaXRvckNvbXBvbmVudD17dHJ1ZX1cbiAgICAgICAgICBvblZhbGlkYXRlT2JqZWN0PXsoKSA9PiB7fX1cbiAgICAgICAgICBpc05ld0VkaXRvckNvbXBvbmVudD17ZWxlbWVudC5kYXRhLnNob3J0Y29kZU5ld31cbiAgICAgICAgICBpc1NlbGVjdGVkPXtpc1NlbGVjdGVkfVxuICAgICAgICAvPlxuICAgICAgICB7Y2hpbGRyZW59XG4gICAgICA8L2Rpdj5cbiAgICApXG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNob3J0Y29kZTtcbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
};
function Shortcode(props) {
  const editor = (0, _slateReact.useSlate)();
  const {
    element,
    dataKey = 'shortcodeData',
    children
  } = props;
  const EditorControl = (0, _index.getEditorControl)();
  const plugin = (0, _index.getEditorComponents)().get(element.data.shortcode);
  const fieldKeys = ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'];
  const field = (0, _immutable.fromJS)((0, _omit2.default)(plugin, fieldKeys));
  const [value, setValue] = (0, _react.useState)((0, _immutable.fromJS)(element.data[dataKey]));
  function handleChange(fieldName, value, metadata) {
    const path = _slateReact.ReactEditor.findPath(editor, element);
    const newProperties = {
      data: _objectSpread(_objectSpread({}, element.data), {}, {
        [dataKey]: value.toJS(),
        metadata
      })
    };
    _slate.Transforms.setNodes(editor, newProperties, {
      at: path
    });
    setValue(value);
  }
  function handleFocus() {
    const path = _slateReact.ReactEditor.findPath(editor, element);
    _slate.Transforms.select(editor, path);
  }
  const path = _slateReact.ReactEditor.findPath(editor, element);
  const isSelected = editor.selection && path && _slate.Range.isRange(editor.selection) && _slate.Range.includes(editor.selection, path);
  return !field.isEmpty() && (0, _core.jsx)("div", {
    onClick: handleFocus,
    onFocus: handleFocus
  }, (0, _core.jsx)(EditorControl, {
    css: _ref,
    value: value,
    field: field,
    onChange: handleChange,
    isEditorComponent: true,
    onValidateObject: () => {},
    isNewEditorComponent: element.data.shortcodeNew,
    isSelected: isSelected
  }), children);
}
var _default = Shortcode;
exports.default = _default;