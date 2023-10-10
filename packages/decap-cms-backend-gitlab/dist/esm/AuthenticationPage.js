"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _decapCmsLibAuth = require("decap-cms-lib-auth");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const LoginButtonIcon = ( /*#__PURE__*/0, _styledBase.default)(_decapCmsUiDefault.Icon, {
  target: "e80yw6v0",
  label: "LoginButtonIcon"
})(process.env.NODE_ENV === "production" ? {
  name: "x0sdsu",
  styles: "margin-right:18px;"
} : {
  name: "x0sdsu",
  styles: "margin-right:18px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVW9DIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7XG4gIE5ldGxpZnlBdXRoZW50aWNhdG9yLFxuICBJbXBsaWNpdEF1dGhlbnRpY2F0b3IsXG4gIFBrY2VBdXRoZW50aWNhdG9yLFxufSBmcm9tICdkZWNhcC1jbXMtbGliLWF1dGgnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25QYWdlLCBJY29uIH0gZnJvbSAnZGVjYXAtY21zLXVpLWRlZmF1bHQnO1xuXG5jb25zdCBMb2dpbkJ1dHRvbkljb24gPSBzdHlsZWQoSWNvbilgXG4gIG1hcmdpbi1yaWdodDogMThweDtcbmA7XG5cbmNvbnN0IGNsaWVudFNpZGVBdXRoZW50aWNhdG9ycyA9IHtcbiAgcGtjZTogKHsgYmFzZV91cmwsIGF1dGhfZW5kcG9pbnQsIGFwcF9pZCwgYXV0aF90b2tlbl9lbmRwb2ludCB9KSA9PlxuICAgIG5ldyBQa2NlQXV0aGVudGljYXRvcih7IGJhc2VfdXJsLCBhdXRoX2VuZHBvaW50LCBhcHBfaWQsIGF1dGhfdG9rZW5fZW5kcG9pbnQgfSksXG5cbiAgaW1wbGljaXQ6ICh7IGJhc2VfdXJsLCBhdXRoX2VuZHBvaW50LCBhcHBfaWQsIGNsZWFySGFzaCB9KSA9PlxuICAgIG5ldyBJbXBsaWNpdEF1dGhlbnRpY2F0b3IoeyBiYXNlX3VybCwgYXV0aF9lbmRwb2ludCwgYXBwX2lkLCBjbGVhckhhc2ggfSksXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHaXRMYWJBdXRoZW50aWNhdGlvblBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIG9uTG9naW46IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgaW5Qcm9ncmVzczogUHJvcFR5cGVzLmJvb2wsXG4gICAgYmFzZV91cmw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgc2l0ZUlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGF1dGhFbmRwb2ludDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjb25maWc6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBjbGVhckhhc2g6IFByb3BUeXBlcy5mdW5jLFxuICAgIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIH07XG5cbiAgc3RhdGUgPSB7fTtcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBhdXRoX3R5cGU6IGF1dGhUeXBlID0gJycsXG4gICAgICBiYXNlX3VybCA9ICdodHRwczovL2dpdGxhYi5jb20nLFxuICAgICAgYXV0aF9lbmRwb2ludCA9ICdvYXV0aC9hdXRob3JpemUnLFxuICAgICAgYXBwX2lkID0gJycsXG4gICAgfSA9IHRoaXMucHJvcHMuY29uZmlnLmJhY2tlbmQ7XG5cbiAgICBpZiAoY2xpZW50U2lkZUF1dGhlbnRpY2F0b3JzW2F1dGhUeXBlXSkge1xuICAgICAgdGhpcy5hdXRoID0gY2xpZW50U2lkZUF1dGhlbnRpY2F0b3JzW2F1dGhUeXBlXSh7XG4gICAgICAgIGJhc2VfdXJsLFxuICAgICAgICBhdXRoX2VuZHBvaW50LFxuICAgICAgICBhcHBfaWQsXG4gICAgICAgIGF1dGhfdG9rZW5fZW5kcG9pbnQ6ICdvYXV0aC90b2tlbicsXG4gICAgICAgIGNsZWFySGFzaDogdGhpcy5wcm9wcy5jbGVhckhhc2gsXG4gICAgICB9KTtcbiAgICAgIC8vIENvbXBsZXRlIGltcGxpY2l0IGF1dGhlbnRpY2F0aW9uIGlmIHdlIHdlcmUgcmVkaXJlY3RlZCBiYWNrIHRvIGZyb20gdGhlIHByb3ZpZGVyLlxuICAgICAgdGhpcy5hdXRoLmNvbXBsZXRlQXV0aCgoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgbG9naW5FcnJvcjogZXJyLnRvU3RyaW5nKCkgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvcHMub25Mb2dpbihkYXRhKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmF1dGggPSBuZXcgTmV0bGlmeUF1dGhlbnRpY2F0b3Ioe1xuICAgICAgICBiYXNlX3VybDogdGhpcy5wcm9wcy5iYXNlX3VybCxcbiAgICAgICAgc2l0ZV9pZDpcbiAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ob3N0LnNwbGl0KCc6JylbMF0gPT09ICdsb2NhbGhvc3QnXG4gICAgICAgICAgICA/ICdkZW1vLmRlY2FwY21zLm9yZydcbiAgICAgICAgICAgIDogdGhpcy5wcm9wcy5zaXRlSWQsXG4gICAgICAgIGF1dGhfZW5kcG9pbnQ6IHRoaXMucHJvcHMuYXV0aEVuZHBvaW50LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlTG9naW4gPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5hdXRoLmF1dGhlbnRpY2F0ZSh7IHByb3ZpZGVyOiAnZ2l0bGFiJywgc2NvcGU6ICdhcGknIH0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvZ2luRXJyb3I6IGVyci50b1N0cmluZygpIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnByb3BzLm9uTG9naW4oZGF0YSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgaW5Qcm9ncmVzcywgY29uZmlnLCB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICA8QXV0aGVudGljYXRpb25QYWdlXG4gICAgICAgIG9uTG9naW49e3RoaXMuaGFuZGxlTG9naW59XG4gICAgICAgIGxvZ2luRGlzYWJsZWQ9e2luUHJvZ3Jlc3N9XG4gICAgICAgIGxvZ2luRXJyb3JNZXNzYWdlPXt0aGlzLnN0YXRlLmxvZ2luRXJyb3J9XG4gICAgICAgIGxvZ29Vcmw9e2NvbmZpZy5sb2dvX3VybH1cbiAgICAgICAgc2l0ZVVybD17Y29uZmlnLnNpdGVfdXJsfVxuICAgICAgICByZW5kZXJCdXR0b25Db250ZW50PXsoKSA9PiAoXG4gICAgICAgICAgPFJlYWN0LkZyYWdtZW50PlxuICAgICAgICAgICAgPExvZ2luQnV0dG9uSWNvbiB0eXBlPVwiZ2l0bGFiXCIgLz57JyAnfVxuICAgICAgICAgICAge2luUHJvZ3Jlc3MgPyB0KCdhdXRoLmxvZ2dpbmdJbicpIDogdCgnYXV0aC5sb2dpbldpdGhHaXRMYWInKX1cbiAgICAgICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgICAgICApfVxuICAgICAgICB0PXt0fVxuICAgICAgLz5cbiAgICApO1xuICB9XG59XG4iXX0= */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const clientSideAuthenticators = {
  pkce: ({
    base_url,
    auth_endpoint,
    app_id,
    auth_token_endpoint
  }) => new _decapCmsLibAuth.PkceAuthenticator({
    base_url,
    auth_endpoint,
    app_id,
    auth_token_endpoint
  }),
  implicit: ({
    base_url,
    auth_endpoint,
    app_id,
    clearHash
  }) => new _decapCmsLibAuth.ImplicitAuthenticator({
    base_url,
    auth_endpoint,
    app_id,
    clearHash
  })
};
class GitLabAuthenticationPage extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "state", {});
    _defineProperty(this, "handleLogin", e => {
      e.preventDefault();
      this.auth.authenticate({
        provider: 'gitlab',
        scope: 'api'
      }, (err, data) => {
        if (err) {
          this.setState({
            loginError: err.toString()
          });
          return;
        }
        this.props.onLogin(data);
      });
    });
  }
  componentDidMount() {
    const {
      auth_type: authType = '',
      base_url = 'https://gitlab.com',
      auth_endpoint = 'oauth/authorize',
      app_id = ''
    } = this.props.config.backend;
    if (clientSideAuthenticators[authType]) {
      this.auth = clientSideAuthenticators[authType]({
        base_url,
        auth_endpoint,
        app_id,
        auth_token_endpoint: 'oauth/token',
        clearHash: this.props.clearHash
      });
      // Complete implicit authentication if we were redirected back to from the provider.
      this.auth.completeAuth((err, data) => {
        if (err) {
          this.setState({
            loginError: err.toString()
          });
          return;
        }
        this.props.onLogin(data);
      });
    } else {
      this.auth = new _decapCmsLibAuth.NetlifyAuthenticator({
        base_url: this.props.base_url,
        site_id: document.location.host.split(':')[0] === 'localhost' ? 'demo.decapcms.org' : this.props.siteId,
        auth_endpoint: this.props.authEndpoint
      });
    }
  }
  render() {
    const {
      inProgress,
      config,
      t
    } = this.props;
    return (0, _core.jsx)(_decapCmsUiDefault.AuthenticationPage, {
      onLogin: this.handleLogin,
      loginDisabled: inProgress,
      loginErrorMessage: this.state.loginError,
      logoUrl: config.logo_url,
      siteUrl: config.site_url,
      renderButtonContent: () => (0, _core.jsx)(_react.default.Fragment, null, (0, _core.jsx)(LoginButtonIcon, {
        type: "gitlab"
      }), ' ', inProgress ? t('auth.loggingIn') : t('auth.loginWithGitLab')),
      t: t
    });
  }
}
exports.default = GitLabAuthenticationPage;
_defineProperty(GitLabAuthenticationPage, "propTypes", {
  onLogin: _propTypes.default.func.isRequired,
  inProgress: _propTypes.default.bool,
  base_url: _propTypes.default.string,
  siteId: _propTypes.default.string,
  authEndpoint: _propTypes.default.string,
  config: _propTypes.default.object.isRequired,
  clearHash: _propTypes.default.func,
  t: _propTypes.default.func.isRequired
});