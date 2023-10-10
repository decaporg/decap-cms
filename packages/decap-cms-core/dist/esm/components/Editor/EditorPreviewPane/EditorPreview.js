"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
function isVisible(field) {
  return field.get('widget') !== 'hidden';
}
const PreviewContainer = (0, _styledBase.default)("div", {
  target: "e1iji6y40",
  label: "PreviewContainer"
})(process.env.NODE_ENV === "production" ? {
  name: "1gj2677",
  styles: "font-family:Roboto,'Helvetica Neue',HelveticaNeue,Helvetica,Arial,sans-serif;"
} : {
  name: "1gj2677",
  styles: "font-family:Roboto,'Helvetica Neue',HelveticaNeue,Helvetica,Arial,sans-serif;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0VkaXRvci9FZGl0b3JQcmV2aWV3UGFuZS9FZGl0b3JQcmV2aWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNtQyIsImZpbGUiOiIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9FZGl0b3IvRWRpdG9yUHJldmlld1BhbmUvRWRpdG9yUHJldmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IEltbXV0YWJsZVByb3BUeXBlcyBmcm9tICdyZWFjdC1pbW11dGFibGUtcHJvcHR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcblxuZnVuY3Rpb24gaXNWaXNpYmxlKGZpZWxkKSB7XG4gIHJldHVybiBmaWVsZC5nZXQoJ3dpZGdldCcpICE9PSAnaGlkZGVuJztcbn1cblxuY29uc3QgUHJldmlld0NvbnRhaW5lciA9IHN0eWxlZC5kaXZgXG4gIGZvbnQtZmFtaWx5OiBSb2JvdG8sICdIZWx2ZXRpY2EgTmV1ZScsIEhlbHZldGljYU5ldWUsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWY7XG5gO1xuXG4vKipcbiAqIFVzZSBhIHN0YXRlZnVsIGNvbXBvbmVudCBzbyB0aGF0IGNoaWxkIGNvbXBvbmVudHMgY2FuIGVmZmVjdGl2ZWx5IHV0aWxpemVcbiAqIGBzaG91bGRDb21wb25lbnRVcGRhdGVgLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmV2aWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbiwgZmllbGRzLCB3aWRnZXRGb3IgfSA9IHRoaXMucHJvcHM7XG4gICAgaWYgKCFjb2xsZWN0aW9uIHx8ICFmaWVsZHMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPFByZXZpZXdDb250YWluZXI+XG4gICAgICAgIHtmaWVsZHMuZmlsdGVyKGlzVmlzaWJsZSkubWFwKGZpZWxkID0+IChcbiAgICAgICAgICA8ZGl2IGtleT17ZmllbGQuZ2V0KCduYW1lJyl9Pnt3aWRnZXRGb3IoZmllbGQuZ2V0KCduYW1lJykpfTwvZGl2PlxuICAgICAgICApKX1cbiAgICAgIDwvUHJldmlld0NvbnRhaW5lcj5cbiAgICApO1xuICB9XG59XG5cblByZXZpZXcucHJvcFR5cGVzID0ge1xuICBjb2xsZWN0aW9uOiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gIGVudHJ5OiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gIGZpZWxkczogSW1tdXRhYmxlUHJvcFR5cGVzLmxpc3QuaXNSZXF1aXJlZCxcbiAgZ2V0QXNzZXQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIHdpZGdldEZvcjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbn07XG4iXX0= */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});

/**
 * Use a stateful component so that child components can effectively utilize
 * `shouldComponentUpdate`.
 */
class Preview extends _react.default.Component {
  render() {
    const {
      collection,
      fields,
      widgetFor
    } = this.props;
    if (!collection || !fields) {
      return null;
    }
    return (0, _core.jsx)(PreviewContainer, null, fields.filter(isVisible).map(field => (0, _core.jsx)("div", {
      key: field.get('name')
    }, widgetFor(field.get('name')))));
  }
}
exports.default = Preview;
Preview.propTypes = {
  collection: _reactImmutableProptypes.default.map.isRequired,
  entry: _reactImmutableProptypes.default.map.isRequired,
  fields: _reactImmutableProptypes.default.list.isRequired,
  getAsset: _propTypes.default.func.isRequired,
  widgetFor: _propTypes.default.func.isRequired
};