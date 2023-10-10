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
function ObjectPreview({
  field
}) {
  return (0, _core.jsx)(_decapCmsUiDefault.WidgetPreviewContainer, null, field && field.get('fields') || field.get('field') || null);
}
ObjectPreview.propTypes = {
  field: _propTypes.default.node
};
var _default = ObjectPreview;
exports.default = _default;