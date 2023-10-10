"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactPolyglot = require("react-polyglot");
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function UnknownPreview({
  field,
  t
}) {
  return (0, _core.jsx)("div", {
    className: "nc-widgetPreview"
  }, t('editor.editorWidgets.unknownPreview.noPreview', {
    widget: field.get('widget')
  }));
}
UnknownPreview.propTypes = {
  field: _reactImmutableProptypes.default.map,
  t: _propTypes.default.func.isRequired
};
var _default = (0, _reactPolyglot.translate)()(UnknownPreview);
exports.default = _default;