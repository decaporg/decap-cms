"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _collectionViews = require("../../constants/collectionViews");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const ViewControlsSection = (0, _styledBase.default)("div", {
  target: "evv1i7c0",
  label: "ViewControlsSection"
})(process.env.NODE_ENV === "production" ? {
  name: "nuh2uw",
  styles: "display:flex;align-items:center;justify-content:flex-end;max-width:500px;"
} : {
  name: "nuh2uw",
  styles: "display:flex;align-items:center;justify-content:flex-end;max-width:500px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vVmlld1N0eWxlQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFNc0MiLCJmaWxlIjoiLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvQ29sbGVjdGlvbi9WaWV3U3R5bGVDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEljb24sIGJ1dHRvbnMsIGNvbG9ycyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuaW1wb3J0IHsgVklFV19TVFlMRV9MSVNULCBWSUVXX1NUWUxFX0dSSUQgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvY29sbGVjdGlvblZpZXdzJztcblxuY29uc3QgVmlld0NvbnRyb2xzU2VjdGlvbiA9IHN0eWxlZC5kaXZgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gIG1heC13aWR0aDogNTAwcHg7XG5gO1xuXG5jb25zdCBWaWV3Q29udHJvbHNCdXR0b24gPSBzdHlsZWQuYnV0dG9uYFxuICAke2J1dHRvbnMuYnV0dG9ufTtcbiAgY29sb3I6ICR7cHJvcHMgPT4gKHByb3BzLmlzQWN0aXZlID8gY29sb3JzLmFjdGl2ZSA6ICcjYjNiOWM0Jyl9O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMCA0cHg7XG5cbiAgJjpsYXN0LWNoaWxkIHtcbiAgICBtYXJnaW4tcmlnaHQ6IDA7XG4gIH1cblxuICAke0ljb259IHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgfVxuYDtcblxuZnVuY3Rpb24gVmlld1N0eWxlQ29udHJvbCh7IHZpZXdTdHlsZSwgb25DaGFuZ2VWaWV3U3R5bGUgfSkge1xuICByZXR1cm4gKFxuICAgIDxWaWV3Q29udHJvbHNTZWN0aW9uPlxuICAgICAgPFZpZXdDb250cm9sc0J1dHRvblxuICAgICAgICBpc0FjdGl2ZT17dmlld1N0eWxlID09PSBWSUVXX1NUWUxFX0xJU1R9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ2hhbmdlVmlld1N0eWxlKFZJRVdfU1RZTEVfTElTVCl9XG4gICAgICA+XG4gICAgICAgIDxJY29uIHR5cGU9XCJsaXN0XCIgLz5cbiAgICAgIDwvVmlld0NvbnRyb2xzQnV0dG9uPlxuICAgICAgPFZpZXdDb250cm9sc0J1dHRvblxuICAgICAgICBpc0FjdGl2ZT17dmlld1N0eWxlID09PSBWSUVXX1NUWUxFX0dSSUR9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ2hhbmdlVmlld1N0eWxlKFZJRVdfU1RZTEVfR1JJRCl9XG4gICAgICA+XG4gICAgICAgIDxJY29uIHR5cGU9XCJncmlkXCIgLz5cbiAgICAgIDwvVmlld0NvbnRyb2xzQnV0dG9uPlxuICAgIDwvVmlld0NvbnRyb2xzU2VjdGlvbj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgVmlld1N0eWxlQ29udHJvbDtcbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const ViewControlsButton = (0, _styledBase.default)("button", {
  target: "evv1i7c1",
  label: "ViewControlsButton"
})(_decapCmsUiDefault.buttons.button, ";color:", props => props.isActive ? _decapCmsUiDefault.colors.active : '#b3b9c4', ";background-color:transparent;display:block;padding:0;margin:0 4px;&:last-child{margin-right:0;}", _decapCmsUiDefault.Icon, "{display:block;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vVmlld1N0eWxlQ29udHJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFhd0MiLCJmaWxlIjoiLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvQ29sbGVjdGlvbi9WaWV3U3R5bGVDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEljb24sIGJ1dHRvbnMsIGNvbG9ycyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuaW1wb3J0IHsgVklFV19TVFlMRV9MSVNULCBWSUVXX1NUWUxFX0dSSUQgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvY29sbGVjdGlvblZpZXdzJztcblxuY29uc3QgVmlld0NvbnRyb2xzU2VjdGlvbiA9IHN0eWxlZC5kaXZgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gIG1heC13aWR0aDogNTAwcHg7XG5gO1xuXG5jb25zdCBWaWV3Q29udHJvbHNCdXR0b24gPSBzdHlsZWQuYnV0dG9uYFxuICAke2J1dHRvbnMuYnV0dG9ufTtcbiAgY29sb3I6ICR7cHJvcHMgPT4gKHByb3BzLmlzQWN0aXZlID8gY29sb3JzLmFjdGl2ZSA6ICcjYjNiOWM0Jyl9O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMCA0cHg7XG5cbiAgJjpsYXN0LWNoaWxkIHtcbiAgICBtYXJnaW4tcmlnaHQ6IDA7XG4gIH1cblxuICAke0ljb259IHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgfVxuYDtcblxuZnVuY3Rpb24gVmlld1N0eWxlQ29udHJvbCh7IHZpZXdTdHlsZSwgb25DaGFuZ2VWaWV3U3R5bGUgfSkge1xuICByZXR1cm4gKFxuICAgIDxWaWV3Q29udHJvbHNTZWN0aW9uPlxuICAgICAgPFZpZXdDb250cm9sc0J1dHRvblxuICAgICAgICBpc0FjdGl2ZT17dmlld1N0eWxlID09PSBWSUVXX1NUWUxFX0xJU1R9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ2hhbmdlVmlld1N0eWxlKFZJRVdfU1RZTEVfTElTVCl9XG4gICAgICA+XG4gICAgICAgIDxJY29uIHR5cGU9XCJsaXN0XCIgLz5cbiAgICAgIDwvVmlld0NvbnRyb2xzQnV0dG9uPlxuICAgICAgPFZpZXdDb250cm9sc0J1dHRvblxuICAgICAgICBpc0FjdGl2ZT17dmlld1N0eWxlID09PSBWSUVXX1NUWUxFX0dSSUR9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ2hhbmdlVmlld1N0eWxlKFZJRVdfU1RZTEVfR1JJRCl9XG4gICAgICA+XG4gICAgICAgIDxJY29uIHR5cGU9XCJncmlkXCIgLz5cbiAgICAgIDwvVmlld0NvbnRyb2xzQnV0dG9uPlxuICAgIDwvVmlld0NvbnRyb2xzU2VjdGlvbj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgVmlld1N0eWxlQ29udHJvbDtcbiJdfQ== */"));
function ViewStyleControl({
  viewStyle,
  onChangeViewStyle
}) {
  return (0, _core.jsx)(ViewControlsSection, null, (0, _core.jsx)(ViewControlsButton, {
    isActive: viewStyle === _collectionViews.VIEW_STYLE_LIST,
    onClick: () => onChangeViewStyle(_collectionViews.VIEW_STYLE_LIST)
  }, (0, _core.jsx)(_decapCmsUiDefault.Icon, {
    type: "list"
  })), (0, _core.jsx)(ViewControlsButton, {
    isActive: viewStyle === _collectionViews.VIEW_STYLE_GRID,
    onClick: () => onChangeViewStyle(_collectionViews.VIEW_STYLE_GRID)
  }, (0, _core.jsx)(_decapCmsUiDefault.Icon, {
    type: "grid"
  })));
}
var _default = ViewStyleControl;
exports.default = _default;