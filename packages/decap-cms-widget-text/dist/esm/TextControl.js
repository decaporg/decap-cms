"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactTextareaAutosize = _interopRequireDefault(require("react-textarea-autosize"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var _ref = process.env.NODE_ENV === "production" ? {
  name: "1feyfsx-TextControl",
  styles: "font-family:inherit;;label:TextControl;"
} : {
  name: "1feyfsx-TextControl",
  styles: "font-family:inherit;;label:TextControl;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9UZXh0Q29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5Q1EiLCJmaWxlIjoiLi4vLi4vc3JjL1RleHRDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgVGV4dGFyZWEgZnJvbSAncmVhY3QtdGV4dGFyZWEtYXV0b3NpemUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0Q29udHJvbCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgZm9ySUQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgdmFsdWU6IFByb3BUeXBlcy5ub2RlLFxuICAgIGNsYXNzTmFtZVdyYXBwZXI6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICBzZXRBY3RpdmVTdHlsZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBzZXRJbmFjdGl2ZVN0eWxlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICB9O1xuXG4gIHN0YXRpYyBkZWZhdWx0UHJvcHMgPSB7XG4gICAgdmFsdWU6ICcnLFxuICB9O1xuXG4gIC8qKlxuICAgKiBBbHdheXMgdXBkYXRlIHRvIGVuc3VyZSBgcmVhY3QtdGV4dGFyZWEtYXV0b3NpemVgIHByb3Blcmx5IGNhbGN1bGF0ZXNcbiAgICogaGVpZ2h0LiBDZXJ0YWluIHNpdHVhdGlvbnMsIHN1Y2ggYXMgdGhpcyB3aWRnZXQgYmVpbmcgbmVzdGVkIGluIGEgbGlzdFxuICAgKiBpdGVtIHRoYXQgZ2V0cyByZWFycmFuZ2VkLCBjYW4gbGVhdmUgdGhlIHRleHRhcmVhIGluIGEgbWluaW1hbCBoZWlnaHRcbiAgICogc3RhdGUuIEFsd2F5cyB1cGRhdGluZyB0aGlzIHBhcnRpY3VsYXIgd2lkZ2V0IHNob3VsZCBnZW5lcmFsbHkgYmUgbG93IGNvc3QsXG4gICAqIGJ1dCB0aGlzIHNob3VsZCBiZSBvcHRpbWl6ZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICovXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGZvcklELCB2YWx1ZSwgb25DaGFuZ2UsIGNsYXNzTmFtZVdyYXBwZXIsIHNldEFjdGl2ZVN0eWxlLCBzZXRJbmFjdGl2ZVN0eWxlIH0gPVxuICAgICAgdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8VGV4dGFyZWFcbiAgICAgICAgaWQ9e2ZvcklEfVxuICAgICAgICB2YWx1ZT17dmFsdWUgfHwgJyd9XG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lV3JhcHBlcn1cbiAgICAgICAgb25Gb2N1cz17c2V0QWN0aXZlU3R5bGV9XG4gICAgICAgIG9uQmx1cj17c2V0SW5hY3RpdmVTdHlsZX1cbiAgICAgICAgbWluUm93cz17NX1cbiAgICAgICAgY3NzPXt7IGZvbnRGYW1pbHk6ICdpbmhlcml0JyB9fVxuICAgICAgICBvbkNoYW5nZT17ZSA9PiBvbkNoYW5nZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAvPlxuICAgICk7XG4gIH1cbn1cbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
};
class TextControl extends _react.default.Component {
  /**
   * Always update to ensure `react-textarea-autosize` properly calculates
   * height. Certain situations, such as this widget being nested in a list
   * item that gets rearranged, can leave the textarea in a minimal height
   * state. Always updating this particular widget should generally be low cost,
   * but this should be optimized in the future.
   */
  shouldComponentUpdate() {
    return true;
  }
  render() {
    const {
      forID,
      value,
      onChange,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;
    return (0, _core.jsx)(_reactTextareaAutosize.default, {
      id: forID,
      value: value || '',
      className: classNameWrapper,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
      minRows: 5,
      css: _ref,
      onChange: e => onChange(e.target.value)
    });
  }
}
exports.default = TextControl;
_defineProperty(TextControl, "propTypes", {
  onChange: _propTypes.default.func.isRequired,
  forID: _propTypes.default.string,
  value: _propTypes.default.node,
  classNameWrapper: _propTypes.default.string.isRequired,
  setActiveStyle: _propTypes.default.func.isRequired,
  setInactiveStyle: _propTypes.default.func.isRequired
});
_defineProperty(TextControl, "defaultProps", {
  value: ''
});