"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _icons = _interopRequireDefault(require("./Icon/icons"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const IconWrapper = (0, _styledBase.default)("span", {
  target: "e1jeq5dr0",
  label: "IconWrapper"
})("display:inline-block;line-height:0;width:", props => props.size, ";height:", props => props.size, ";transform:", props => `rotate(${props.rotation})`, ";& path:not(.no-fill),& circle:not(.no-fill),& polygon:not(.no-fill),& rect:not(.no-fill){fill:currentColor;}& path.clipped{fill:transparent;}svg{width:100%;height:100%;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9JY29uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU0rQiIsImZpbGUiOiIuLi8uLi9zcmMvSWNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuXG5pbXBvcnQgaWNvbnMgZnJvbSAnLi9JY29uL2ljb25zJztcblxuY29uc3QgSWNvbldyYXBwZXIgPSBzdHlsZWQuc3BhbmBcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICBsaW5lLWhlaWdodDogMDtcbiAgd2lkdGg6ICR7cHJvcHMgPT4gcHJvcHMuc2l6ZX07XG4gIGhlaWdodDogJHtwcm9wcyA9PiBwcm9wcy5zaXplfTtcbiAgdHJhbnNmb3JtOiAke3Byb3BzID0+IGByb3RhdGUoJHtwcm9wcy5yb3RhdGlvbn0pYH07XG5cbiAgJiBwYXRoOm5vdCgubm8tZmlsbCksXG4gICYgY2lyY2xlOm5vdCgubm8tZmlsbCksXG4gICYgcG9seWdvbjpub3QoLm5vLWZpbGwpLFxuICAmIHJlY3Q6bm90KC5uby1maWxsKSB7XG4gICAgZmlsbDogY3VycmVudENvbG9yO1xuICB9XG5cbiAgJiBwYXRoLmNsaXBwZWQge1xuICAgIGZpbGw6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgc3ZnIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gIH1cbmA7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyByb3RhdGlvbiBmb3IgaWNvbnMgdGhhdCBoYXZlIGEgYGRpcmVjdGlvbmAgcHJvcGVydHkgY29uZmlndXJlZFxuICogaW4gdGhlIGltcG9ydGVkIGljb24gZGVmaW5pdGlvbiBvYmplY3QuIElmIG5vIGRpcmVjdGlvbiBpcyBjb25maWd1cmVkLCBhXG4gKiBuZXV0cmFsIHJvdGF0aW9uIHZhbHVlIGlzIHJldHVybmVkLlxuICpcbiAqIFJldHVybmVkIHZhbHVlIGlzIGEgc3RyaW5nIG9mIHNoYXBlIGAke2RlZ3JlZXN9ZGVnYCwgZm9yIHVzZSBpbiBhIENTU1xuICogdHJhbnNmb3JtLlxuICovXG5mdW5jdGlvbiBnZXRSb3RhdGlvbihpY29uRGlyZWN0aW9uLCBuZXdEaXJlY3Rpb24pIHtcbiAgaWYgKCFpY29uRGlyZWN0aW9uIHx8ICFuZXdEaXJlY3Rpb24pIHtcbiAgICByZXR1cm4gJzBkZWcnO1xuICB9XG4gIGNvbnN0IHJvdGF0aW9ucyA9IHsgcmlnaHQ6IDkwLCBkb3duOiAxODAsIGxlZnQ6IDI3MCwgdXA6IDM2MCB9O1xuICBjb25zdCBkZWdyZWVzID0gcm90YXRpb25zW25ld0RpcmVjdGlvbl0gLSByb3RhdGlvbnNbaWNvbkRpcmVjdGlvbl07XG4gIHJldHVybiBgJHtkZWdyZWVzfWRlZ2A7XG59XG5cbmNvbnN0IHNpemVzID0ge1xuICB4c21hbGw6ICcxMnB4JyxcbiAgc21hbGw6ICcxOHB4JyxcbiAgbWVkaXVtOiAnMjRweCcsXG4gIGxhcmdlOiAnMzJweCcsXG59O1xuXG5mdW5jdGlvbiBJY29uKHsgdHlwZSwgZGlyZWN0aW9uLCBzaXplID0gJ21lZGl1bScsIGNsYXNzTmFtZSB9KSB7XG4gIGNvbnN0IEljb25TdmcgPSBpY29uc1t0eXBlXS5pbWFnZTtcblxuICByZXR1cm4gKFxuICAgIDxJY29uV3JhcHBlclxuICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWV9XG4gICAgICBzaXplPXtzaXplc1tzaXplXSB8fCBzaXplfVxuICAgICAgcm90YXRpb249e2dldFJvdGF0aW9uKGljb25zW3R5cGVdLmRpcmVjdGlvbiwgZGlyZWN0aW9uKX1cbiAgICA+XG4gICAgICA8SWNvblN2ZyAvPlxuICAgIDwvSWNvbldyYXBwZXI+XG4gICk7XG59XG5cbkljb24ucHJvcFR5cGVzID0ge1xuICB0eXBlOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gIGRpcmVjdGlvbjogUHJvcFR5cGVzLm9uZU9mKFsncmlnaHQnLCAnZG93bicsICdsZWZ0JywgJ3VwJ10pLFxuICBzaXplOiBQcm9wVHlwZXMuc3RyaW5nLFxuICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBzdHlsZWQoSWNvbilgYDtcbiJdfQ== */"));

/**
 * Calculates rotation for icons that have a `direction` property configured
 * in the imported icon definition object. If no direction is configured, a
 * neutral rotation value is returned.
 *
 * Returned value is a string of shape `${degrees}deg`, for use in a CSS
 * transform.
 */
function getRotation(iconDirection, newDirection) {
  if (!iconDirection || !newDirection) {
    return '0deg';
  }
  const rotations = {
    right: 90,
    down: 180,
    left: 270,
    up: 360
  };
  const degrees = rotations[newDirection] - rotations[iconDirection];
  return `${degrees}deg`;
}
const sizes = {
  xsmall: '12px',
  small: '18px',
  medium: '24px',
  large: '32px'
};
function Icon({
  type,
  direction,
  size = 'medium',
  className
}) {
  const IconSvg = _icons.default[type].image;
  return (0, _core.jsx)(IconWrapper, {
    className: className,
    size: sizes[size] || size,
    rotation: getRotation(_icons.default[type].direction, direction)
  }, (0, _core.jsx)(IconSvg, null));
}
Icon.propTypes = {
  type: _propTypes.default.string.isRequired,
  direction: _propTypes.default.oneOf(['right', 'down', 'left', 'up']),
  size: _propTypes.default.string,
  className: _propTypes.default.string
};
var _default = ( /*#__PURE__*/0, _styledBase.default)(Icon, {
  target: "e1jeq5dr1"
})(process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9JY29uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJFMkIiLCJmaWxlIjoiLi4vLi4vc3JjL0ljb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcblxuaW1wb3J0IGljb25zIGZyb20gJy4vSWNvbi9pY29ucyc7XG5cbmNvbnN0IEljb25XcmFwcGVyID0gc3R5bGVkLnNwYW5gXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgbGluZS1oZWlnaHQ6IDA7XG4gIHdpZHRoOiAke3Byb3BzID0+IHByb3BzLnNpemV9O1xuICBoZWlnaHQ6ICR7cHJvcHMgPT4gcHJvcHMuc2l6ZX07XG4gIHRyYW5zZm9ybTogJHtwcm9wcyA9PiBgcm90YXRlKCR7cHJvcHMucm90YXRpb259KWB9O1xuXG4gICYgcGF0aDpub3QoLm5vLWZpbGwpLFxuICAmIGNpcmNsZTpub3QoLm5vLWZpbGwpLFxuICAmIHBvbHlnb246bm90KC5uby1maWxsKSxcbiAgJiByZWN0Om5vdCgubm8tZmlsbCkge1xuICAgIGZpbGw6IGN1cnJlbnRDb2xvcjtcbiAgfVxuXG4gICYgcGF0aC5jbGlwcGVkIHtcbiAgICBmaWxsOiB0cmFuc3BhcmVudDtcbiAgfVxuXG4gIHN2ZyB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICB9XG5gO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgcm90YXRpb24gZm9yIGljb25zIHRoYXQgaGF2ZSBhIGBkaXJlY3Rpb25gIHByb3BlcnR5IGNvbmZpZ3VyZWRcbiAqIGluIHRoZSBpbXBvcnRlZCBpY29uIGRlZmluaXRpb24gb2JqZWN0LiBJZiBubyBkaXJlY3Rpb24gaXMgY29uZmlndXJlZCwgYVxuICogbmV1dHJhbCByb3RhdGlvbiB2YWx1ZSBpcyByZXR1cm5lZC5cbiAqXG4gKiBSZXR1cm5lZCB2YWx1ZSBpcyBhIHN0cmluZyBvZiBzaGFwZSBgJHtkZWdyZWVzfWRlZ2AsIGZvciB1c2UgaW4gYSBDU1NcbiAqIHRyYW5zZm9ybS5cbiAqL1xuZnVuY3Rpb24gZ2V0Um90YXRpb24oaWNvbkRpcmVjdGlvbiwgbmV3RGlyZWN0aW9uKSB7XG4gIGlmICghaWNvbkRpcmVjdGlvbiB8fCAhbmV3RGlyZWN0aW9uKSB7XG4gICAgcmV0dXJuICcwZGVnJztcbiAgfVxuICBjb25zdCByb3RhdGlvbnMgPSB7IHJpZ2h0OiA5MCwgZG93bjogMTgwLCBsZWZ0OiAyNzAsIHVwOiAzNjAgfTtcbiAgY29uc3QgZGVncmVlcyA9IHJvdGF0aW9uc1tuZXdEaXJlY3Rpb25dIC0gcm90YXRpb25zW2ljb25EaXJlY3Rpb25dO1xuICByZXR1cm4gYCR7ZGVncmVlc31kZWdgO1xufVxuXG5jb25zdCBzaXplcyA9IHtcbiAgeHNtYWxsOiAnMTJweCcsXG4gIHNtYWxsOiAnMThweCcsXG4gIG1lZGl1bTogJzI0cHgnLFxuICBsYXJnZTogJzMycHgnLFxufTtcblxuZnVuY3Rpb24gSWNvbih7IHR5cGUsIGRpcmVjdGlvbiwgc2l6ZSA9ICdtZWRpdW0nLCBjbGFzc05hbWUgfSkge1xuICBjb25zdCBJY29uU3ZnID0gaWNvbnNbdHlwZV0uaW1hZ2U7XG5cbiAgcmV0dXJuIChcbiAgICA8SWNvbldyYXBwZXJcbiAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuICAgICAgc2l6ZT17c2l6ZXNbc2l6ZV0gfHwgc2l6ZX1cbiAgICAgIHJvdGF0aW9uPXtnZXRSb3RhdGlvbihpY29uc1t0eXBlXS5kaXJlY3Rpb24sIGRpcmVjdGlvbil9XG4gICAgPlxuICAgICAgPEljb25TdmcgLz5cbiAgICA8L0ljb25XcmFwcGVyPlxuICApO1xufVxuXG5JY29uLnByb3BUeXBlcyA9IHtcbiAgdHlwZTogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBkaXJlY3Rpb246IFByb3BUeXBlcy5vbmVPZihbJ3JpZ2h0JywgJ2Rvd24nLCAnbGVmdCcsICd1cCddKSxcbiAgc2l6ZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgc3R5bGVkKEljb24pYGA7XG4iXX0= */");
exports.default = _default;