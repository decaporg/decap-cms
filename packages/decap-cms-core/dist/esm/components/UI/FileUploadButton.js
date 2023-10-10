"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileUploadButton = FileUploadButton;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function FileUploadButton({
  label,
  imagesOnly,
  onChange,
  disabled,
  className
}) {
  return (0, _core.jsx)("label", {
    tabIndex: '0',
    className: `nc-fileUploadButton ${className || ''}`
  }, (0, _core.jsx)("span", null, label), (0, _core.jsx)("input", {
    type: "file",
    accept: imagesOnly ? 'image/*' : '*/*',
    onChange: onChange,
    disabled: disabled
  }));
}
FileUploadButton.propTypes = {
  className: _propTypes.default.string,
  label: _propTypes.default.string.isRequired,
  imagesOnly: _propTypes.default.bool,
  onChange: _propTypes.default.func.isRequired,
  disabled: _propTypes.default.bool
};