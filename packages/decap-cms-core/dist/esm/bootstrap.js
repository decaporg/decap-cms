"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactDom = require("react-dom");
var _reactRedux = require("react-redux");
var _reactRouterDom = require("react-router-dom");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _reactPolyglot = require("react-polyglot");
var _redux = require("./redux");
var _history = require("./routing/history");
var _config = require("./actions/config");
var _auth = require("./actions/auth");
var _phrases = require("./lib/phrases");
var _config2 = require("./reducers/config");
var _UI = require("./components/UI");
var _App = _interopRequireDefault(require("./components/App/App"));
require("./components/EditorWidgets");
require("./mediaLibrary");
require("what-input");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const ROOT_ID = 'nc-root';
function TranslatedApp({
  locale,
  config
}) {
  return (0, _core.jsx)(_reactPolyglot.I18n, {
    locale: locale,
    messages: (0, _phrases.getPhrases)(locale)
  }, (0, _core.jsx)(_UI.ErrorBoundary, {
    showBackup: true,
    config: config
  }, (0, _core.jsx)(_reactRouterDom.Router, {
    history: _history.history
  }, (0, _core.jsx)(_reactRouterDom.Route, {
    component: _App.default
  }))));
}
function mapDispatchToProps(state) {
  return {
    locale: (0, _config2.selectLocale)(state.config),
    config: state.config
  };
}
const ConnectedTranslatedApp = (0, _reactRedux.connect)(mapDispatchToProps)(TranslatedApp);
function bootstrap(opts = {}) {
  const {
    config
  } = opts;

  /**
   * Log the version number.
   */
  if (typeof "3.2.4" === 'string') {
    console.log(`decap-cms-core ${"3.2.4"}`);
  }

  /**
   * Get DOM element where app will mount.
   */
  function getRoot() {
    /**
     * Return existing root if found.
     */
    const existingRoot = document.getElementById(ROOT_ID);
    if (existingRoot) {
      return existingRoot;
    }

    /**
     * If no existing root, create and return a new root.
     */
    const newRoot = document.createElement('div');
    newRoot.id = ROOT_ID;
    document.body.appendChild(newRoot);
    return newRoot;
  }

  /**
   * Dispatch config to store if received. This config will be merged into
   * config.yml if it exists, and any portion that produces a conflict will be
   * overwritten.
   */
  _redux.store.dispatch((0, _config.loadConfig)(config, function onLoad() {
    _redux.store.dispatch((0, _auth.authenticateUser)());
  }));

  /**
   * Create connected root component.
   */
  function Root() {
    return (0, _core.jsx)(_react.default.Fragment, null, (0, _core.jsx)(_decapCmsUiDefault.GlobalStyles, null), (0, _core.jsx)(_reactRedux.Provider, {
      store: _redux.store
    }, (0, _core.jsx)(ConnectedTranslatedApp, null)));
  }

  /**
   * Render application root.
   */
  (0, _reactDom.render)((0, _core.jsx)(Root, null), getRoot());
}
var _default = bootstrap;
exports.default = _default;