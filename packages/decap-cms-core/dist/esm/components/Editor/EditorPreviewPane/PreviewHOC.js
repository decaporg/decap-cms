"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
const _excluded = ["previewComponent"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
class PreviewHOC extends _react.default.Component {
  /**
   * Only re-render on value change, but always re-render objects and lists.
   * Their child widgets will each also be wrapped with this component, and
   * will only be updated on value change.
   */
  shouldComponentUpdate(nextProps) {
    const isWidgetContainer = ['object', 'list'].includes(nextProps.field.get('widget'));
    return isWidgetContainer || this.props.value !== nextProps.value || this.props.fieldsMetaData !== nextProps.fieldsMetaData || this.props.getAsset !== nextProps.getAsset;
  }
  render() {
    const _this$props = this.props,
      {
        previewComponent
      } = _this$props,
      props = _objectWithoutProperties(_this$props, _excluded);
    return /*#__PURE__*/_react.default.createElement(previewComponent, props);
  }
}
PreviewHOC.propTypes = {
  previewComponent: _propTypes.default.func.isRequired,
  field: _reactImmutableProptypes.default.map.isRequired,
  value: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.object, _propTypes.default.string, _propTypes.default.bool])
};
var _default = PreviewHOC;
exports.default = _default;