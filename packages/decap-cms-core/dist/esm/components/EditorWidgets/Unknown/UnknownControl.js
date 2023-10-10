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
function UnknownControl({
  field,
  t
}) {
  return (0, _core.jsx)("div", null, t('editor.editorWidgets.unknownControl.noControl', {
    widget: field.get('widget')
  }));
}
UnknownControl.propTypes = {
  field: _reactImmutableProptypes.default.map,
  t: _propTypes.default.func.isRequired
};
var _default = (0, _reactPolyglot.translate)()(UnknownControl);
exports.default = _default;