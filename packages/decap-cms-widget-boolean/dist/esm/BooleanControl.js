"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _core = require("@emotion/core");
var _decapCmsUiDefault = require("decap-cms-ui-default");
const _excluded = ["isActive"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function BooleanBackground(_ref) {
  let {
      isActive
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded);
  return (0, _core.jsx)(_decapCmsUiDefault.ToggleBackground, _extends({
    css: /*#__PURE__*/(0, _core.css)("background-color:", isActive ? _decapCmsUiDefault.colors.active : _decapCmsUiDefault.colors.textFieldBorder, ";;label:BooleanBackground;" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Cb29sZWFuQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTYyIsImZpbGUiOiIuLi8uLi9zcmMvQm9vbGVhbkNvbnRyb2wuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBJbW11dGFibGVQcm9wVHlwZXMgZnJvbSAncmVhY3QtaW1tdXRhYmxlLXByb3B0eXBlcyc7XG5pbXBvcnQgeyBjc3MgfSBmcm9tICdAZW1vdGlvbi9jb3JlJztcbmltcG9ydCB7IFRvZ2dsZSwgVG9nZ2xlQmFja2dyb3VuZCwgY29sb3JzIH0gZnJvbSAnZGVjYXAtY21zLXVpLWRlZmF1bHQnO1xuXG5mdW5jdGlvbiBCb29sZWFuQmFja2dyb3VuZCh7IGlzQWN0aXZlLCAuLi5wcm9wcyB9KSB7XG4gIHJldHVybiAoXG4gICAgPFRvZ2dsZUJhY2tncm91bmRcbiAgICAgIGNzcz17Y3NzYFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAke2lzQWN0aXZlID8gY29sb3JzLmFjdGl2ZSA6IGNvbG9ycy50ZXh0RmllbGRCb3JkZXJ9O1xuICAgICAgYH1cbiAgICAgIHsuLi5wcm9wc31cbiAgICAvPlxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb29sZWFuQ29udHJvbCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IHZhbHVlLCBmb3JJRCwgb25DaGFuZ2UsIGNsYXNzTmFtZVdyYXBwZXIsIHNldEFjdGl2ZVN0eWxlLCBzZXRJbmFjdGl2ZVN0eWxlIH0gPVxuICAgICAgdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZVdyYXBwZXJ9PlxuICAgICAgICA8VG9nZ2xlXG4gICAgICAgICAgaWQ9e2ZvcklEfVxuICAgICAgICAgIGFjdGl2ZT17dmFsdWV9XG4gICAgICAgICAgb25DaGFuZ2U9e29uQ2hhbmdlfVxuICAgICAgICAgIG9uRm9jdXM9e3NldEFjdGl2ZVN0eWxlfVxuICAgICAgICAgIG9uQmx1cj17c2V0SW5hY3RpdmVTdHlsZX1cbiAgICAgICAgICBCYWNrZ3JvdW5kPXtCb29sZWFuQmFja2dyb3VuZH1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cblxuQm9vbGVhbkNvbnRyb2wucHJvcFR5cGVzID0ge1xuICBmaWVsZDogSW1tdXRhYmxlUHJvcFR5cGVzLm1hcC5pc1JlcXVpcmVkLFxuICBvbkNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgY2xhc3NOYW1lV3JhcHBlcjogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBzZXRBY3RpdmVTdHlsZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgc2V0SW5hY3RpdmVTdHlsZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgZm9ySUQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gIHZhbHVlOiBQcm9wVHlwZXMuYm9vbCxcbn07XG5cbkJvb2xlYW5Db250cm9sLmRlZmF1bHRQcm9wcyA9IHtcbiAgdmFsdWU6IGZhbHNlLFxufTtcbiJdfQ== */"))
  }, props));
}
class BooleanControl extends _react.default.Component {
  render() {
    const {
      value,
      forID,
      onChange,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;
    return (0, _core.jsx)("div", {
      className: classNameWrapper
    }, (0, _core.jsx)(_decapCmsUiDefault.Toggle, {
      id: forID,
      active: value,
      onChange: onChange,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
      Background: BooleanBackground
    }));
  }
}
exports.default = BooleanControl;
BooleanControl.propTypes = {
  field: _reactImmutableProptypes.default.map.isRequired,
  onChange: _propTypes.default.func.isRequired,
  classNameWrapper: _propTypes.default.string.isRequired,
  setActiveStyle: _propTypes.default.func.isRequired,
  setInactiveStyle: _propTypes.default.func.isRequired,
  forID: _propTypes.default.string,
  value: _propTypes.default.bool
};
BooleanControl.defaultProps = {
  value: false
};