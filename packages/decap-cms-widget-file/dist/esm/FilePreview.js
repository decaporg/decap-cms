"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = require("immutable");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const FileLink = ( /*#__PURE__*/0, _styledBase.default)(({
  href,
  path
}) => (0, _core.jsx)("a", {
  href: href,
  rel: "noopener noreferrer",
  target: "_blank"
}, path), {
  target: "ecp3s3o0",
  label: "FileLink"
})(process.env.NODE_ENV === "production" ? {
  name: "13o7eu2",
  styles: "display:block;"
} : {
  name: "13o7eu2",
  styles: "display:block;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GaWxlUHJldmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVRSIsImZpbGUiOiIuLi8uLi9zcmMvRmlsZVByZXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IExpc3QgfSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IHsgV2lkZ2V0UHJldmlld0NvbnRhaW5lciB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgRmlsZUxpbmsgPSBzdHlsZWQoKHsgaHJlZiwgcGF0aCB9KSA9PiAoXG4gIDxhIGhyZWY9e2hyZWZ9IHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cbiAgICB7cGF0aH1cbiAgPC9hPlxuKSlgXG4gIGRpc3BsYXk6IGJsb2NrO1xuYDtcblxuZnVuY3Rpb24gRmlsZUxpbmtMaXN0KHsgdmFsdWVzLCBnZXRBc3NldCwgZmllbGQgfSkge1xuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICB7dmFsdWVzLm1hcCh2YWx1ZSA9PiAoXG4gICAgICAgIDxGaWxlTGluayBrZXk9e3ZhbHVlfSBwYXRoPXt2YWx1ZX0gaHJlZj17Z2V0QXNzZXQodmFsdWUsIGZpZWxkKX0gLz5cbiAgICAgICkpfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBGaWxlQ29udGVudChwcm9wcykge1xuICBjb25zdCB7IHZhbHVlLCBnZXRBc3NldCwgZmllbGQgfSA9IHByb3BzO1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgTGlzdC5pc0xpc3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIDxGaWxlTGlua0xpc3QgdmFsdWVzPXt2YWx1ZX0gZ2V0QXNzZXQ9e2dldEFzc2V0fSBmaWVsZD17ZmllbGR9IC8+O1xuICB9XG4gIHJldHVybiA8RmlsZUxpbmsga2V5PXt2YWx1ZX0gcGF0aD17dmFsdWV9IGhyZWY9e2dldEFzc2V0KHZhbHVlLCBmaWVsZCl9IC8+O1xufVxuXG5mdW5jdGlvbiBGaWxlUHJldmlldyhwcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxXaWRnZXRQcmV2aWV3Q29udGFpbmVyPlxuICAgICAge3Byb3BzLnZhbHVlID8gPEZpbGVDb250ZW50IHsuLi5wcm9wc30gLz4gOiBudWxsfVxuICAgIDwvV2lkZ2V0UHJldmlld0NvbnRhaW5lcj5cbiAgKTtcbn1cblxuRmlsZVByZXZpZXcucHJvcFR5cGVzID0ge1xuICBnZXRBc3NldDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgdmFsdWU6IFByb3BUeXBlcy5ub2RlLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgRmlsZVByZXZpZXc7XG4iXX0= */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
function FileLinkList({
  values,
  getAsset,
  field
}) {
  return (0, _core.jsx)("div", null, values.map(value => (0, _core.jsx)(FileLink, {
    key: value,
    path: value,
    href: getAsset(value, field)
  })));
}
function FileContent(props) {
  const {
    value,
    getAsset,
    field
  } = props;
  if (Array.isArray(value) || _immutable.List.isList(value)) {
    return (0, _core.jsx)(FileLinkList, {
      values: value,
      getAsset: getAsset,
      field: field
    });
  }
  return (0, _core.jsx)(FileLink, {
    key: value,
    path: value,
    href: getAsset(value, field)
  });
}
function FilePreview(props) {
  return (0, _core.jsx)(_decapCmsUiDefault.WidgetPreviewContainer, null, props.value ? (0, _core.jsx)(FileContent, props) : null);
}
FilePreview.propTypes = {
  getAsset: _propTypes.default.func.isRequired,
  value: _propTypes.default.node
};
var _default = FilePreview;
exports.default = _default;