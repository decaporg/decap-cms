"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ControlButton = ControlButton;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _core = require("@emotion/core");
var _decapCmsUiDefault = require("decap-cms-ui-default");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const Button = ( /*#__PURE__*/0, _styledBase.default)(_decapCmsUiDefault.StyledDropdownButton, {
  target: "e1obtllk0",
  label: "Button"
})(_decapCmsUiDefault.buttons.button, ";", _decapCmsUiDefault.buttons.medium, ";", _decapCmsUiDefault.buttons.grayText, ";font-size:14px;&:after{top:11px;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vQ29udHJvbEJ1dHRvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLMkMiLCJmaWxlIjoiLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvQ29sbGVjdGlvbi9Db250cm9sQnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNzcyB9IGZyb20gJ0BlbW90aW9uL2NvcmUnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IHsgYnV0dG9ucywgU3R5bGVkRHJvcGRvd25CdXR0b24sIGNvbG9ycyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgQnV0dG9uID0gc3R5bGVkKFN0eWxlZERyb3Bkb3duQnV0dG9uKWBcbiAgJHtidXR0b25zLmJ1dHRvbn07XG4gICR7YnV0dG9ucy5tZWRpdW19O1xuICAke2J1dHRvbnMuZ3JheVRleHR9O1xuICBmb250LXNpemU6IDE0cHg7XG5cbiAgJjphZnRlciB7XG4gICAgdG9wOiAxMXB4O1xuICB9XG5gO1xuXG5leHBvcnQgZnVuY3Rpb24gQ29udHJvbEJ1dHRvbih7IGFjdGl2ZSwgdGl0bGUgfSkge1xuICByZXR1cm4gKFxuICAgIDxCdXR0b25cbiAgICAgIGNzcz17Y3NzYFxuICAgICAgICBjb2xvcjogJHthY3RpdmUgPyBjb2xvcnMuYWN0aXZlIDogdW5kZWZpbmVkfTtcbiAgICAgIGB9XG4gICAgPlxuICAgICAge3RpdGxlfVxuICAgIDwvQnV0dG9uPlxuICApO1xufVxuIl19 */"));
function ControlButton({
  active,
  title
}) {
  return (0, _core.jsx)(Button, {
    css: /*#__PURE__*/(0, _core.css)("color:", active ? _decapCmsUiDefault.colors.active : undefined, ";;label:ControlButton;" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vQ29udHJvbEJ1dHRvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtQmMiLCJmaWxlIjoiLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvQ29sbGVjdGlvbi9Db250cm9sQnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNzcyB9IGZyb20gJ0BlbW90aW9uL2NvcmUnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IHsgYnV0dG9ucywgU3R5bGVkRHJvcGRvd25CdXR0b24sIGNvbG9ycyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgQnV0dG9uID0gc3R5bGVkKFN0eWxlZERyb3Bkb3duQnV0dG9uKWBcbiAgJHtidXR0b25zLmJ1dHRvbn07XG4gICR7YnV0dG9ucy5tZWRpdW19O1xuICAke2J1dHRvbnMuZ3JheVRleHR9O1xuICBmb250LXNpemU6IDE0cHg7XG5cbiAgJjphZnRlciB7XG4gICAgdG9wOiAxMXB4O1xuICB9XG5gO1xuXG5leHBvcnQgZnVuY3Rpb24gQ29udHJvbEJ1dHRvbih7IGFjdGl2ZSwgdGl0bGUgfSkge1xuICByZXR1cm4gKFxuICAgIDxCdXR0b25cbiAgICAgIGNzcz17Y3NzYFxuICAgICAgICBjb2xvcjogJHthY3RpdmUgPyBjb2xvcnMuYWN0aXZlIDogdW5kZWZpbmVkfTtcbiAgICAgIGB9XG4gICAgPlxuICAgICAge3RpdGxlfVxuICAgIDwvQnV0dG9uPlxuICApO1xufVxuIl19 */"))
  }, title);
}