"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isString2 = _interopRequireDefault(require("lodash/isString"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = require("immutable");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function toValue(value, field) {
  if ((0, _isString2.default)(value)) {
    return value;
  }
  if (_immutable.Map.isMap(value)) {
    return value.get(field.getIn(['keys', 'code'], 'code'), '');
  }
  return '';
}
function CodePreview(props) {
  return (0, _core.jsx)(_decapCmsUiDefault.WidgetPreviewContainer, null, (0, _core.jsx)("pre", null, (0, _core.jsx)("code", null, toValue(props.value, props.field))));
}
CodePreview.propTypes = {
  value: _propTypes.default.node
};
var _default = CodePreview;
exports.default = _default;