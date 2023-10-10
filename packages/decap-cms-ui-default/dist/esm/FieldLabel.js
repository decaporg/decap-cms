"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _styles = require("./styles");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const stateColors = {
  default: {
    background: _styles.colors.textFieldBorder,
    text: _styles.colors.controlLabel
  },
  active: {
    background: _styles.colors.active,
    text: _styles.colors.textLight
  },
  error: {
    background: _styles.colors.errorText,
    text: _styles.colorsRaw.white
  }
};
function getStateColors({
  isActive,
  hasErrors
}) {
  if (hasErrors) return stateColors.error;
  if (isActive) return stateColors.active;
  return stateColors.default;
}
const FieldLabel = (0, _styledBase.default)("label", {
  target: "e1xtv0oy0",
  label: "FieldLabel"
})(_styles.text.fieldLabel, ";color:", props => getStateColors(props).text, ";background-color:", props => getStateColors(props).background, ";display:inline-block;border:0;border-radius:3px 3px 0 0;padding:3px 6px 2px;margin:0;transition:all ", _styles.transitions.main, ";position:relative;&:before,&:after{content:'';display:block;position:absolute;top:0;right:-4px;height:100%;width:4px;background-color:inherit;}&:after{border-bottom-left-radius:3px;background-color:#fff;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GaWVsZExhYmVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXlCK0IiLCJmaWxlIjoiLi4vLi4vc3JjL0ZpZWxkTGFiZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5cbmltcG9ydCB7IGNvbG9ycywgY29sb3JzUmF3LCB0cmFuc2l0aW9ucywgdGV4dCB9IGZyb20gJy4vc3R5bGVzJztcblxuY29uc3Qgc3RhdGVDb2xvcnMgPSB7XG4gIGRlZmF1bHQ6IHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvcnMudGV4dEZpZWxkQm9yZGVyLFxuICAgIHRleHQ6IGNvbG9ycy5jb250cm9sTGFiZWwsXG4gIH0sXG4gIGFjdGl2ZToge1xuICAgIGJhY2tncm91bmQ6IGNvbG9ycy5hY3RpdmUsXG4gICAgdGV4dDogY29sb3JzLnRleHRMaWdodCxcbiAgfSxcbiAgZXJyb3I6IHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvcnMuZXJyb3JUZXh0LFxuICAgIHRleHQ6IGNvbG9yc1Jhdy53aGl0ZSxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIGdldFN0YXRlQ29sb3JzKHsgaXNBY3RpdmUsIGhhc0Vycm9ycyB9KSB7XG4gIGlmIChoYXNFcnJvcnMpIHJldHVybiBzdGF0ZUNvbG9ycy5lcnJvcjtcbiAgaWYgKGlzQWN0aXZlKSByZXR1cm4gc3RhdGVDb2xvcnMuYWN0aXZlO1xuICByZXR1cm4gc3RhdGVDb2xvcnMuZGVmYXVsdDtcbn1cblxuY29uc3QgRmllbGRMYWJlbCA9IHN0eWxlZC5sYWJlbGBcbiAgJHt0ZXh0LmZpZWxkTGFiZWx9O1xuICBjb2xvcjogJHtwcm9wcyA9PiBnZXRTdGF0ZUNvbG9ycyhwcm9wcykudGV4dH07XG4gIGJhY2tncm91bmQtY29sb3I6ICR7cHJvcHMgPT4gZ2V0U3RhdGVDb2xvcnMocHJvcHMpLmJhY2tncm91bmR9O1xuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogM3B4IDNweCAwIDA7XG4gIHBhZGRpbmc6IDNweCA2cHggMnB4O1xuICBtYXJnaW46IDA7XG4gIHRyYW5zaXRpb246IGFsbCAke3RyYW5zaXRpb25zLm1haW59O1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG5cbiAgLyoqXG4gICAqIEZhdXggb3V0c2lkZSBjdXJ2ZSBpbnRvIHRvcCBvZiBpbnB1dFxuICAgKi9cbiAgJjpiZWZvcmUsXG4gICY6YWZ0ZXIge1xuICAgIGNvbnRlbnQ6ICcnO1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDA7XG4gICAgcmlnaHQ6IC00cHg7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIHdpZHRoOiA0cHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogaW5oZXJpdDtcbiAgfVxuXG4gICY6YWZ0ZXIge1xuICAgIGJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6IDNweDtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBGaWVsZExhYmVsO1xuIl19 */"));
var _default = FieldLabel;
exports.default = _default;