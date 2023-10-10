"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const EmptyMessageContainer = (0, _styledBase.default)("div", {
  target: "e156433y0",
  label: "EmptyMessageContainer"
})("height:100%;width:100%;display:flex;justify-content:center;align-items:center;color:", props => props.isPrivate && _decapCmsUiDefault.colors.textFieldBorder, ";" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL01lZGlhTGlicmFyeS9FbXB0eU1lc3NhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS3dDIiwiZmlsZSI6Ii4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL01lZGlhTGlicmFyeS9FbXB0eU1lc3NhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgRW1wdHlNZXNzYWdlQ29udGFpbmVyID0gc3R5bGVkLmRpdmBcbiAgaGVpZ2h0OiAxMDAlO1xuICB3aWR0aDogMTAwJTtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGNvbG9yOiAke3Byb3BzID0+IHByb3BzLmlzUHJpdmF0ZSAmJiBjb2xvcnMudGV4dEZpZWxkQm9yZGVyfTtcbmA7XG5cbmZ1bmN0aW9uIEVtcHR5TWVzc2FnZSh7IGNvbnRlbnQsIGlzUHJpdmF0ZSB9KSB7XG4gIHJldHVybiAoXG4gICAgPEVtcHR5TWVzc2FnZUNvbnRhaW5lciBpc1ByaXZhdGU9e2lzUHJpdmF0ZX0+XG4gICAgICA8aDE+e2NvbnRlbnR9PC9oMT5cbiAgICA8L0VtcHR5TWVzc2FnZUNvbnRhaW5lcj5cbiAgKTtcbn1cblxuRW1wdHlNZXNzYWdlLnByb3BUeXBlcyA9IHtcbiAgY29udGVudDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBpc1ByaXZhdGU6IFByb3BUeXBlcy5ib29sLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgRW1wdHlNZXNzYWdlO1xuIl19 */"));
function EmptyMessage({
  content,
  isPrivate
}) {
  return (0, _core.jsx)(EmptyMessageContainer, {
    isPrivate: isPrivate
  }, (0, _core.jsx)("h1", null, content));
}
EmptyMessage.propTypes = {
  content: _propTypes.default.string.isRequired,
  isPrivate: _propTypes.default.bool
};
var _default = EmptyMessage;
exports.default = _default;