"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function NumberPreview({
  value
}) {
  return (0, _core.jsx)(_decapCmsUiDefault.WidgetPreviewContainer, null, value);
}
NumberPreview.propTypes = {
  value: _propTypes.default.node
};
var _default = NumberPreview;
exports.default = _default;