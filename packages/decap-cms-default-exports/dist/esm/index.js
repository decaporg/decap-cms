"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DecapCmsDefaultExports = void 0;
var _styled2 = _interopRequireDefault(require("@emotion/styled"));
var _css2 = _interopRequireDefault(require("@emotion/css"));
var _core = require("@emotion/core");
var _immutable = _interopRequireDefault(require("immutable"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _lodash = _interopRequireDefault(require("lodash/lodash"));
var _moment = _interopRequireDefault(require("moment"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactDom = _interopRequireDefault(require("react-dom"));
var UUId = _interopRequireWildcard(require("uuid"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// eslint-disable-next-line @emotion/no-vanilla

const EmotionCore = {
  css: _css2.default,
  withEmotionCache: _core.withEmotionCache,
  CacheProvider: _core.CacheProvider,
  ThemeContext: _core.ThemeContext,
  jsx: _core.jsx,
  Global: _core.Global,
  keyframes: _core.keyframes,
  ClassNames: _core.ClassNames
};
const DecapCmsDefaultExports = {
  EmotionCore,
  EmotionStyled: _styled2.default,
  Immutable: _immutable.default,
  ImmutablePropTypes: _reactImmutableProptypes.default,
  Lodash: _lodash.default,
  Moment: _moment.default,
  PropTypes: _propTypes.default,
  React: _react.default,
  ReactDOM: _reactDom.default,
  UUId
};
exports.DecapCmsDefaultExports = DecapCmsDefaultExports;