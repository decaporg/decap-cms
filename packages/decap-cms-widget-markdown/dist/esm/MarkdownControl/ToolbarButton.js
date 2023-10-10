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
const StyledToolbarButton = (0, _styledBase.default)("button", {
  target: "e1ps9s9m0",
  label: "StyledToolbarButton"
})(_decapCmsUiDefault.buttons.button, ";display:inline-block;padding:6px;border:none;background-color:transparent;font-size:16px;color:", props => props.isActive ? '#1e2532' : 'inherit', ";cursor:pointer;&:disabled{cursor:auto;opacity:0.5;}", _decapCmsUiDefault.Icon, "{display:block;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9NYXJrZG93bkNvbnRyb2wvVG9vbGJhckJ1dHRvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLeUMiLCJmaWxlIjoiLi4vLi4vLi4vc3JjL01hcmtkb3duQ29udHJvbC9Ub29sYmFyQnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyBJY29uLCBidXR0b25zIH0gZnJvbSAnZGVjYXAtY21zLXVpLWRlZmF1bHQnO1xuXG5jb25zdCBTdHlsZWRUb29sYmFyQnV0dG9uID0gc3R5bGVkLmJ1dHRvbmBcbiAgJHtidXR0b25zLmJ1dHRvbn07XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgcGFkZGluZzogNnB4O1xuICBib3JkZXI6IG5vbmU7XG4gIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICBmb250LXNpemU6IDE2cHg7XG4gIGNvbG9yOiAke3Byb3BzID0+IChwcm9wcy5pc0FjdGl2ZSA/ICcjMWUyNTMyJyA6ICdpbmhlcml0Jyl9O1xuICBjdXJzb3I6IHBvaW50ZXI7XG5cbiAgJjpkaXNhYmxlZCB7XG4gICAgY3Vyc29yOiBhdXRvO1xuICAgIG9wYWNpdHk6IDAuNTtcbiAgfVxuXG4gICR7SWNvbn0ge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICB9XG5gO1xuXG5mdW5jdGlvbiBUb29sYmFyQnV0dG9uKHsgdHlwZSwgbGFiZWwsIGljb24sIG9uQ2xpY2ssIGlzQWN0aXZlLCBkaXNhYmxlZCB9KSB7XG4gIHJldHVybiAoXG4gICAgPFN0eWxlZFRvb2xiYXJCdXR0b25cbiAgICAgIGlzQWN0aXZlPXtpc0FjdGl2ZX1cbiAgICAgIG9uQ2xpY2s9e2UgPT4gb25DbGljayAmJiBvbkNsaWNrKGUsIHR5cGUpfVxuICAgICAgdGl0bGU9e2xhYmVsfVxuICAgICAgZGlzYWJsZWQ9e2Rpc2FibGVkfVxuICAgID5cbiAgICAgIHtpY29uID8gPEljb24gdHlwZT17aWNvbn0gLz4gOiBsYWJlbH1cbiAgICA8L1N0eWxlZFRvb2xiYXJCdXR0b24+XG4gICk7XG59XG5cblRvb2xiYXJCdXR0b24ucHJvcFR5cGVzID0ge1xuICB0eXBlOiBQcm9wVHlwZXMuc3RyaW5nLFxuICBsYWJlbDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICBpY29uOiBQcm9wVHlwZXMuc3RyaW5nLFxuICBvbkNsaWNrOiBQcm9wVHlwZXMuZnVuYyxcbiAgaXNBY3RpdmU6IFByb3BUeXBlcy5ib29sLFxuICBkaXNhYmxlZDogUHJvcFR5cGVzLmJvb2wsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBUb29sYmFyQnV0dG9uO1xuIl19 */"));
function ToolbarButton({
  type,
  label,
  icon,
  onClick,
  isActive,
  disabled
}) {
  return (0, _core.jsx)(StyledToolbarButton, {
    isActive: isActive,
    onClick: e => onClick && onClick(e, type),
    title: label,
    disabled: disabled
  }, icon ? (0, _core.jsx)(_decapCmsUiDefault.Icon, {
    type: icon
  }) : label);
}
ToolbarButton.propTypes = {
  type: _propTypes.default.string,
  label: _propTypes.default.string.isRequired,
  icon: _propTypes.default.string,
  onClick: _propTypes.default.func,
  isActive: _propTypes.default.bool,
  disabled: _propTypes.default.bool
};
var _default = ToolbarButton;
exports.default = _default;