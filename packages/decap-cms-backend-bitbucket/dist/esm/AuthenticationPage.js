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
  target: "e15sc0jo0",
  label: "LoginButtonIcon"
})(process.env.NODE_ENV === "production" ? {
  name: "x0sdsu",
  styles: "margin-right:18px;"
} : {
  name: "x0sdsu",
  styles: "margin-right:18px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTW9DIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IE5ldGxpZnlBdXRoZW50aWNhdG9yLCBJbXBsaWNpdEF1dGhlbnRpY2F0b3IgfSBmcm9tICdkZWNhcC1jbXMtbGliLWF1dGgnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25QYWdlLCBJY29uIH0gZnJvbSAnZGVjYXAtY21zLXVpLWRlZmF1bHQnO1xuXG5jb25zdCBMb2dpbkJ1dHRvbkljb24gPSBzdHlsZWQoSWNvbilgXG4gIG1hcmdpbi1yaWdodDogMThweDtcbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJpdGJ1Y2tldEF1dGhlbnRpY2F0aW9uUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgb25Mb2dpbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBpblByb2dyZXNzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICBiYXNlX3VybDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBzaXRlSWQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgYXV0aEVuZHBvaW50OiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGNvbmZpZzogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIGNsZWFySGFzaDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgfTtcblxuICBzdGF0ZSA9IHt9O1xuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHsgYXV0aF90eXBlOiBhdXRoVHlwZSA9ICcnIH0gPSB0aGlzLnByb3BzLmNvbmZpZy5iYWNrZW5kO1xuXG4gICAgaWYgKGF1dGhUeXBlID09PSAnaW1wbGljaXQnKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGJhc2VfdXJsID0gJ2h0dHBzOi8vYml0YnVja2V0Lm9yZycsXG4gICAgICAgIGF1dGhfZW5kcG9pbnQgPSAnc2l0ZS9vYXV0aDIvYXV0aG9yaXplJyxcbiAgICAgICAgYXBwX2lkID0gJycsXG4gICAgICB9ID0gdGhpcy5wcm9wcy5jb25maWcuYmFja2VuZDtcblxuICAgICAgdGhpcy5hdXRoID0gbmV3IEltcGxpY2l0QXV0aGVudGljYXRvcih7XG4gICAgICAgIGJhc2VfdXJsLFxuICAgICAgICBhdXRoX2VuZHBvaW50LFxuICAgICAgICBhcHBfaWQsXG4gICAgICAgIGNsZWFySGFzaDogdGhpcy5wcm9wcy5jbGVhckhhc2gsXG4gICAgICB9KTtcbiAgICAgIC8vIENvbXBsZXRlIGltcGxpY2l0IGF1dGhlbnRpY2F0aW9uIGlmIHdlIHdlcmUgcmVkaXJlY3RlZCBiYWNrIHRvIGZyb20gdGhlIHByb3ZpZGVyLlxuICAgICAgdGhpcy5hdXRoLmNvbXBsZXRlQXV0aCgoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgbG9naW5FcnJvcjogZXJyLnRvU3RyaW5nKCkgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvcHMub25Mb2dpbihkYXRhKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hdXRoU2V0dGluZ3MgPSB7IHNjb3BlOiAncmVwb3NpdG9yeTp3cml0ZScgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hdXRoID0gbmV3IE5ldGxpZnlBdXRoZW50aWNhdG9yKHtcbiAgICAgICAgYmFzZV91cmw6IHRoaXMucHJvcHMuYmFzZV91cmwsXG4gICAgICAgIHNpdGVfaWQ6XG4gICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaG9zdC5zcGxpdCgnOicpWzBdID09PSAnbG9jYWxob3N0J1xuICAgICAgICAgICAgPyAnZGVtby5kZWNhcGNtcy5vcmcnXG4gICAgICAgICAgICA6IHRoaXMucHJvcHMuc2l0ZUlkLFxuICAgICAgICBhdXRoX2VuZHBvaW50OiB0aGlzLnByb3BzLmF1dGhFbmRwb2ludCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5hdXRoU2V0dGluZ3MgPSB7IHByb3ZpZGVyOiAnYml0YnVja2V0Jywgc2NvcGU6ICdyZXBvJyB9O1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUxvZ2luID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuYXV0aC5hdXRoZW50aWNhdGUodGhpcy5hdXRoU2V0dGluZ3MsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvZ2luRXJyb3I6IGVyci50b1N0cmluZygpIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnByb3BzLm9uTG9naW4oZGF0YSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgaW5Qcm9ncmVzcywgY29uZmlnLCB0IH0gPSB0aGlzLnByb3BzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxBdXRoZW50aWNhdGlvblBhZ2VcbiAgICAgICAgb25Mb2dpbj17dGhpcy5oYW5kbGVMb2dpbn1cbiAgICAgICAgbG9naW5EaXNhYmxlZD17aW5Qcm9ncmVzc31cbiAgICAgICAgbG9naW5FcnJvck1lc3NhZ2U9e3RoaXMuc3RhdGUubG9naW5FcnJvcn1cbiAgICAgICAgbG9nb1VybD17Y29uZmlnLmxvZ29fdXJsfVxuICAgICAgICBzaXRlVXJsPXtjb25maWcuc2l0ZV91cmx9XG4gICAgICAgIHJlbmRlckJ1dHRvbkNvbnRlbnQ9eygpID0+IChcbiAgICAgICAgICA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICAgICA8TG9naW5CdXR0b25JY29uIHR5cGU9XCJiaXRidWNrZXRcIiAvPlxuICAgICAgICAgICAge2luUHJvZ3Jlc3MgPyB0KCdhdXRoLmxvZ2dpbmdJbicpIDogdCgnYXV0aC5sb2dpbldpdGhCaXRidWNrZXQnKX1cbiAgICAgICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgICAgICApfVxuICAgICAgICB0PXt0fVxuICAgICAgLz5cbiAgICApO1xuICB9XG59XG4iXX0= */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
class BitbucketAuthenticationPage extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "state", {});
    _defineProperty(this, "handleLogin", e => {
      e.preventDefault();
      this.auth.authenticate(this.authSettings, (err, data) => {
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
      auth_type: authType = ''
    } = this.props.config.backend;
    if (authType === 'implicit') {
      const {
        base_url = 'https://bitbucket.org',
        auth_endpoint = 'site/oauth2/authorize',
        app_id = ''
      } = this.props.config.backend;
      this.auth = new _decapCmsLibAuth.ImplicitAuthenticator({
        base_url,
        auth_endpoint,
        app_id,
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
      this.authSettings = {
        scope: 'repository:write'
      };
    } else {
      this.auth = new _decapCmsLibAuth.NetlifyAuthenticator({
        base_url: this.props.base_url,
        site_id: document.location.host.split(':')[0] === 'localhost' ? 'demo.decapcms.org' : this.props.siteId,
        auth_endpoint: this.props.authEndpoint
      });
      this.authSettings = {
        provider: 'bitbucket',
        scope: 'repo'
      };
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
        type: "bitbucket"
      }), inProgress ? t('auth.loggingIn') : t('auth.loginWithBitbucket')),
      t: t
    });
  }
}
exports.default = BitbucketAuthenticationPage;
_defineProperty(BitbucketAuthenticationPage, "propTypes", {
  onLogin: _propTypes.default.func.isRequired,
  inProgress: _propTypes.default.bool,
  base_url: _propTypes.default.string,
  siteId: _propTypes.default.string,
  authEndpoint: _propTypes.default.string,
  config: _propTypes.default.object.isRequired,
  clearHash: _propTypes.default.func,
  t: _propTypes.default.func.isRequired
});