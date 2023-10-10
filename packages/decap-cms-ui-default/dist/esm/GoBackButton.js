"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _styles = require("./styles.js");
var _Icon = _interopRequireDefault(require("./Icon"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const GoBackButtonStyle = (0, _styledBase.default)("a", {
  target: "e1sptrq40",
  label: "GoBackButtonStyle"
})(process.env.NODE_ENV === "production" ? {
  name: "uebubq",
  styles: "display:flex;align-items:center;margin-top:50px;padding:10px;font-size:14px;"
} : {
  name: "uebubq",
  styles: "display:flex;align-items:center;margin-top:50px;padding:10px;font-size:14px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb0JhY2tCdXR0b24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT2tDIiwiZmlsZSI6Ii4uLy4uL3NyYy9Hb0JhY2tCdXR0b24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuaW1wb3J0IHsgY29sb3JzUmF3IH0gZnJvbSAnLi9zdHlsZXMuanMnO1xuaW1wb3J0IEljb24gZnJvbSAnLi9JY29uJztcblxuY29uc3QgR29CYWNrQnV0dG9uU3R5bGUgPSBzdHlsZWQuYWBcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcblxuICBtYXJnaW4tdG9wOiA1MHB4O1xuICBwYWRkaW5nOiAxMHB4O1xuXG4gIGZvbnQtc2l6ZTogMTRweDtcbmA7XG5cbmNvbnN0IEJ1dHRvblRleHQgPSBzdHlsZWQucGBcbiAgY29sb3I6ICR7Y29sb3JzUmF3LmdyYXl9O1xuICBtYXJnaW46IDAgMTBweDtcbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdvQmFja0J1dHRvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgaHJlZjogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgaHJlZiwgdCB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8R29CYWNrQnV0dG9uU3R5bGUgaHJlZj17aHJlZn0+XG4gICAgICAgIDxJY29uIHR5cGU9XCJhcnJvd1wiIHNpemU9XCJzbWFsbFwiIC8+XG4gICAgICAgIDxCdXR0b25UZXh0Pnt0KCd1aS5kZWZhdWx0LmdvQmFja1RvU2l0ZScpfTwvQnV0dG9uVGV4dD5cbiAgICAgIDwvR29CYWNrQnV0dG9uU3R5bGU+XG4gICAgKTtcbiAgfVxufVxuIl19 */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const ButtonText = (0, _styledBase.default)("p", {
  target: "e1sptrq41",
  label: "ButtonText"
})("color:", _styles.colorsRaw.gray, ";margin:0 10px;" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb0JhY2tCdXR0b24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBaUIyQiIsImZpbGUiOiIuLi8uLi9zcmMvR29CYWNrQnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5cbmltcG9ydCB7IGNvbG9yc1JhdyB9IGZyb20gJy4vc3R5bGVzLmpzJztcbmltcG9ydCBJY29uIGZyb20gJy4vSWNvbic7XG5cbmNvbnN0IEdvQmFja0J1dHRvblN0eWxlID0gc3R5bGVkLmFgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cbiAgbWFyZ2luLXRvcDogNTBweDtcbiAgcGFkZGluZzogMTBweDtcblxuICBmb250LXNpemU6IDE0cHg7XG5gO1xuXG5jb25zdCBCdXR0b25UZXh0ID0gc3R5bGVkLnBgXG4gIGNvbG9yOiAke2NvbG9yc1Jhdy5ncmF5fTtcbiAgbWFyZ2luOiAwIDEwcHg7XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHb0JhY2tCdXR0b24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIGhyZWY6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICB0OiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICB9O1xuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGhyZWYsIHQgfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPEdvQmFja0J1dHRvblN0eWxlIGhyZWY9e2hyZWZ9PlxuICAgICAgICA8SWNvbiB0eXBlPVwiYXJyb3dcIiBzaXplPVwic21hbGxcIiAvPlxuICAgICAgICA8QnV0dG9uVGV4dD57dCgndWkuZGVmYXVsdC5nb0JhY2tUb1NpdGUnKX08L0J1dHRvblRleHQ+XG4gICAgICA8L0dvQmFja0J1dHRvblN0eWxlPlxuICAgICk7XG4gIH1cbn1cbiJdfQ== */"));
class GoBackButton extends _react.default.Component {
  render() {
    const {
      href,
      t
    } = this.props;
    return (0, _core.jsx)(GoBackButtonStyle, {
      href: href
    }, (0, _core.jsx)(_Icon.default, {
      type: "arrow",
      size: "small"
    }), (0, _core.jsx)(ButtonText, null, t('ui.default.goBackToSite')));
  }
}
exports.default = GoBackButton;
_defineProperty(GoBackButton, "propTypes", {
  href: _propTypes.default.string.isRequired,
  t: _propTypes.default.func.isRequired
});