"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactIs = require("react-is");
var _reactScrollSync = require("react-scroll-sync");
var _reactFrameComponent = require("react-frame-component");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * We need to create a lightweight component here so that we can access the
 * context within the Frame. This allows us to attach the ScrollSyncPane to the
 * body.
 */class PreviewContent extends _react.default.Component {
  render() {
    const {
      previewComponent,
      previewProps
    } = this.props;
    return (0, _core.jsx)(_reactFrameComponent.FrameContextConsumer, null, context => (0, _core.jsx)(_reactScrollSync.ScrollSyncPane, {
      attachTo: context.document.scrollingElement
    }, (0, _reactIs.isElement)(previewComponent) ? /*#__PURE__*/_react.default.cloneElement(previewComponent, previewProps) : /*#__PURE__*/_react.default.createElement(previewComponent, previewProps)));
  }
}
PreviewContent.propTypes = {
  previewComponent: _propTypes.default.func.isRequired,
  previewProps: _propTypes.default.object
};
var _default = PreviewContent;
exports.default = _default;