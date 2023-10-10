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
  target: "e1n0346u0",
  label: "LoginButtonIcon"
})(process.env.NODE_ENV === "production" ? {
  name: "x0sdsu",
  styles: "margin-right:18px;"
} : {
  name: "x0sdsu",
  styles: "margin-right:18px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTW9DIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEltcGxpY2l0QXV0aGVudGljYXRvciB9IGZyb20gJ2RlY2FwLWNtcy1saWItYXV0aCc7XG5pbXBvcnQgeyBBdXRoZW50aWNhdGlvblBhZ2UsIEljb24gfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5cbmNvbnN0IExvZ2luQnV0dG9uSWNvbiA9IHN0eWxlZChJY29uKWBcbiAgbWFyZ2luLXJpZ2h0OiAxOHB4O1xuYDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXp1cmVBdXRoZW50aWNhdGlvblBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIG9uTG9naW46IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgaW5Qcm9ncmVzczogUHJvcFR5cGVzLmJvb2wsXG4gICAgYmFzZV91cmw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgc2l0ZUlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGF1dGhFbmRwb2ludDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjb25maWc6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBjbGVhckhhc2g6IFByb3BUeXBlcy5mdW5jLFxuICAgIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIH07XG5cbiAgc3RhdGUgPSB7fTtcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLmF1dGggPSBuZXcgSW1wbGljaXRBdXRoZW50aWNhdG9yKHtcbiAgICAgIGJhc2VfdXJsOiBgaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tLyR7dGhpcy5wcm9wcy5jb25maWcuYmFja2VuZC50ZW5hbnRfaWR9YCxcbiAgICAgIGF1dGhfZW5kcG9pbnQ6ICdvYXV0aDIvYXV0aG9yaXplJyxcbiAgICAgIGFwcF9pZDogdGhpcy5wcm9wcy5jb25maWcuYmFja2VuZC5hcHBfaWQsXG4gICAgICBjbGVhckhhc2g6IHRoaXMucHJvcHMuY2xlYXJIYXNoLFxuICAgIH0pO1xuICAgIC8vIENvbXBsZXRlIGltcGxpY2l0IGF1dGhlbnRpY2F0aW9uIGlmIHdlIHdlcmUgcmVkaXJlY3RlZCBiYWNrIHRvIGZyb20gdGhlIHByb3ZpZGVyLlxuICAgIHRoaXMuYXV0aC5jb21wbGV0ZUF1dGgoKGVyciwgZGF0YSkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBhbGVydChlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnByb3BzLm9uTG9naW4oZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICBoYW5kbGVMb2dpbiA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmF1dGguYXV0aGVudGljYXRlKFxuICAgICAge1xuICAgICAgICBzY29wZTogJ3Zzby5jb2RlX2Z1bGwsdXNlci5yZWFkJyxcbiAgICAgICAgcmVzb3VyY2U6ICc0OTliODRhYy0xMzIxLTQyN2YtYWExNy0yNjdjYTY5NzU3OTgnLFxuICAgICAgICBwcm9tcHQ6ICdzZWxlY3RfYWNjb3VudCcsXG4gICAgICB9LFxuICAgICAgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvZ2luRXJyb3I6IGVyci50b1N0cmluZygpIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3BzLm9uTG9naW4oZGF0YSk7XG4gICAgICB9LFxuICAgICk7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgaW5Qcm9ncmVzcywgY29uZmlnLCB0IH0gPSB0aGlzLnByb3BzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxBdXRoZW50aWNhdGlvblBhZ2VcbiAgICAgICAgb25Mb2dpbj17dGhpcy5oYW5kbGVMb2dpbn1cbiAgICAgICAgbG9naW5EaXNhYmxlZD17aW5Qcm9ncmVzc31cbiAgICAgICAgbG9naW5FcnJvck1lc3NhZ2U9e3RoaXMuc3RhdGUubG9naW5FcnJvcn1cbiAgICAgICAgbG9nb1VybD17Y29uZmlnLmxvZ29fdXJsfVxuICAgICAgICByZW5kZXJCdXR0b25Db250ZW50PXsoKSA9PiAoXG4gICAgICAgICAgPFJlYWN0LkZyYWdtZW50PlxuICAgICAgICAgICAgPExvZ2luQnV0dG9uSWNvbiB0eXBlPVwiYXp1cmVcIiAvPlxuICAgICAgICAgICAge2luUHJvZ3Jlc3MgPyB0KCdhdXRoLmxvZ2dpbmdJbicpIDogdCgnYXV0aC5sb2dpbldpdGhBenVyZScpfVxuICAgICAgICAgIDwvUmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICl9XG4gICAgICAgIHQ9e3R9XG4gICAgICAvPlxuICAgICk7XG4gIH1cbn1cbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
class AzureAuthenticationPage extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "state", {});
    _defineProperty(this, "handleLogin", e => {
      e.preventDefault();
      this.auth.authenticate({
        scope: 'vso.code_full,user.read',
        resource: '499b84ac-1321-427f-aa17-267ca6975798',
        prompt: 'select_account'
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
    this.auth = new _decapCmsLibAuth.ImplicitAuthenticator({
      base_url: `https://login.microsoftonline.com/${this.props.config.backend.tenant_id}`,
      auth_endpoint: 'oauth2/authorize',
      app_id: this.props.config.backend.app_id,
      clearHash: this.props.clearHash
    });
    // Complete implicit authentication if we were redirected back to from the provider.
    this.auth.completeAuth((err, data) => {
      if (err) {
        alert(err);
        return;
      }
      this.props.onLogin(data);
    });
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
      renderButtonContent: () => (0, _core.jsx)(_react.default.Fragment, null, (0, _core.jsx)(LoginButtonIcon, {
        type: "azure"
      }), inProgress ? t('auth.loggingIn') : t('auth.loginWithAzure')),
      t: t
    });
  }
}
exports.default = AzureAuthenticationPage;
_defineProperty(AzureAuthenticationPage, "propTypes", {
  onLogin: _propTypes.default.func.isRequired,
  inProgress: _propTypes.default.bool,
  base_url: _propTypes.default.string,
  siteId: _propTypes.default.string,
  authEndpoint: _propTypes.default.string,
  config: _propTypes.default.object.isRequired,
  clearHash: _propTypes.default.func,
  t: _propTypes.default.func.isRequired
});