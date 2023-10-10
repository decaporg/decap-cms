"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _Icon = _interopRequireDefault(require("./Icon"));
var _styles = require("./styles");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const sizes = {
  small: '28px',
  large: '40px'
};
const ButtonRound = (0, _styledBase.default)("button", {
  target: "em2wuvj0",
  label: "ButtonRound"
})(_styles.buttons.button, ";", _styles.shadows.dropMiddle, ";background-color:", _styles.colorsRaw.white, ";color:", props => _styles.colors[props.isActive ? `active` : `inactive`], ";border-radius:32px;display:flex;justify-content:center;align-items:center;width:", props => sizes[props.size], ";height:", props => sizes[props.size], ";padding:0;" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9JY29uQnV0dG9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVdpQyIsImZpbGUiOiIuLi8uLi9zcmMvSWNvbkJ1dHRvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5cbmltcG9ydCBJY29uIGZyb20gJy4vSWNvbic7XG5pbXBvcnQgeyBidXR0b25zLCBjb2xvcnMsIGNvbG9yc1Jhdywgc2hhZG93cyB9IGZyb20gJy4vc3R5bGVzJztcblxuY29uc3Qgc2l6ZXMgPSB7XG4gIHNtYWxsOiAnMjhweCcsXG4gIGxhcmdlOiAnNDBweCcsXG59O1xuXG5jb25zdCBCdXR0b25Sb3VuZCA9IHN0eWxlZC5idXR0b25gXG4gICR7YnV0dG9ucy5idXR0b259O1xuICAke3NoYWRvd3MuZHJvcE1pZGRsZX07XG4gIGJhY2tncm91bmQtY29sb3I6ICR7Y29sb3JzUmF3LndoaXRlfTtcbiAgY29sb3I6ICR7cHJvcHMgPT4gY29sb3JzW3Byb3BzLmlzQWN0aXZlID8gYGFjdGl2ZWAgOiBgaW5hY3RpdmVgXX07XG4gIGJvcmRlci1yYWRpdXM6IDMycHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB3aWR0aDogJHtwcm9wcyA9PiBzaXplc1twcm9wcy5zaXplXX07XG4gIGhlaWdodDogJHtwcm9wcyA9PiBzaXplc1twcm9wcy5zaXplXX07XG4gIHBhZGRpbmc6IDA7XG5gO1xuXG5mdW5jdGlvbiBJY29uQnV0dG9uKHsgc2l6ZSwgaXNBY3RpdmUsIHR5cGUsIG9uQ2xpY2ssIGNsYXNzTmFtZSwgdGl0bGUgfSkge1xuICByZXR1cm4gKFxuICAgIDxCdXR0b25Sb3VuZFxuICAgICAgc2l6ZT17c2l6ZX1cbiAgICAgIGlzQWN0aXZlPXtpc0FjdGl2ZX1cbiAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuICAgICAgb25DbGljaz17b25DbGlja31cbiAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICA+XG4gICAgICA8SWNvbiB0eXBlPXt0eXBlfSBzaXplPXtzaXplfSAvPlxuICAgIDwvQnV0dG9uUm91bmQ+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IEljb25CdXR0b247XG4iXX0= */"));
function IconButton({
  size,
  isActive,
  type,
  onClick,
  className,
  title
}) {
  return (0, _core.jsx)(ButtonRound, {
    size: size,
    isActive: isActive,
    className: className,
    onClick: onClick,
    title: title
  }, (0, _core.jsx)(_Icon.default, {
    type: type,
    size: size
  }));
}
var _default = IconButton;
exports.default = _default;