"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const StyledAuthenticationPage = (0, _styledBase.default)("section", {
  target: "e141mjkc0",
  label: "StyledAuthenticationPage"
})(process.env.NODE_ENV === "production" ? {
  name: "8n3yzp",
  styles: "display:flex;flex-flow:column nowrap;align-items:center;justify-content:center;gap:50px;height:100vh;"
} : {
  name: "8n3yzp",
  styles: "display:flex;flex-flow:column nowrap;align-items:center;justify-content:center;gap:50px;height:100vh;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSytDIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEljb24sIGJ1dHRvbnMsIHNoYWRvd3MsIEdvQmFja0J1dHRvbiB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgU3R5bGVkQXV0aGVudGljYXRpb25QYWdlID0gc3R5bGVkLnNlY3Rpb25gXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZmxvdzogY29sdW1uIG5vd3JhcDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGdhcDogNTBweDtcbiAgaGVpZ2h0OiAxMDB2aDtcbmA7XG5cbmNvbnN0IFBhZ2VMb2dvSWNvbiA9IHN0eWxlZChJY29uKWBcbiAgaGVpZ2h0OiBhdXRvO1xuYDtcblxuY29uc3QgTG9naW5CdXR0b24gPSBzdHlsZWQuYnV0dG9uYFxuICAke2J1dHRvbnMuYnV0dG9ufTtcbiAgJHtzaGFkb3dzLmRyb3BEZWVwfTtcbiAgJHtidXR0b25zLmRlZmF1bHR9O1xuICAke2J1dHRvbnMuZ3JheX07XG5cbiAgcGFkZGluZzogMCAzMHB4O1xuICBtYXJnaW4tdG9wOiAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG5cbiAgJHtJY29ufSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAxOHB4O1xuICB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRoZW50aWNhdGlvblBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIG9uTG9naW46IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgaW5Qcm9ncmVzczogUHJvcFR5cGVzLmJvb2wsXG4gICAgY29uZmlnOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgfTtcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAvKipcbiAgICAgKiBBbGxvdyBsb2dpbiBzY3JlZW4gdG8gYmUgc2tpcHBlZCBmb3IgZGVtbyBwdXJwb3Nlcy5cbiAgICAgKi9cbiAgICBjb25zdCBza2lwTG9naW4gPSB0aGlzLnByb3BzLmNvbmZpZy5iYWNrZW5kLmxvZ2luID09PSBmYWxzZTtcbiAgICBpZiAoc2tpcExvZ2luKSB7XG4gICAgICB0aGlzLnByb3BzLm9uTG9naW4odGhpcy5zdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlTG9naW4gPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5wcm9wcy5vbkxvZ2luKHRoaXMuc3RhdGUpO1xuICB9O1xuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGNvbmZpZywgaW5Qcm9ncmVzcywgdCB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8U3R5bGVkQXV0aGVudGljYXRpb25QYWdlPlxuICAgICAgICA8UGFnZUxvZ29JY29uIHNpemU9XCIzMDBweFwiIHR5cGU9XCJkZWNhcC1jbXNcIiAvPlxuICAgICAgICA8TG9naW5CdXR0b24gZGlzYWJsZWQ9e2luUHJvZ3Jlc3N9IG9uQ2xpY2s9e3RoaXMuaGFuZGxlTG9naW59PlxuICAgICAgICAgIHtpblByb2dyZXNzID8gdCgnYXV0aC5sb2dnaW5nSW4nKSA6IHQoJ2F1dGgubG9naW4nKX1cbiAgICAgICAgPC9Mb2dpbkJ1dHRvbj5cbiAgICAgICAge2NvbmZpZy5zaXRlX3VybCAmJiA8R29CYWNrQnV0dG9uIGhyZWY9e2NvbmZpZy5zaXRlX3VybH0gdD17dH0+PC9Hb0JhY2tCdXR0b24+fVxuICAgICAgPC9TdHlsZWRBdXRoZW50aWNhdGlvblBhZ2U+XG4gICAgKTtcbiAgfVxufVxuIl19 */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const PageLogoIcon = ( /*#__PURE__*/0, _styledBase.default)(_decapCmsUiDefault.Icon, {
  target: "e141mjkc1",
  label: "PageLogoIcon"
})(process.env.NODE_ENV === "production" ? {
  name: "x97jm9",
  styles: "height:auto;"
} : {
  name: "x97jm9",
  styles: "height:auto;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBY2lDIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEljb24sIGJ1dHRvbnMsIHNoYWRvd3MsIEdvQmFja0J1dHRvbiB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgU3R5bGVkQXV0aGVudGljYXRpb25QYWdlID0gc3R5bGVkLnNlY3Rpb25gXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZmxvdzogY29sdW1uIG5vd3JhcDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGdhcDogNTBweDtcbiAgaGVpZ2h0OiAxMDB2aDtcbmA7XG5cbmNvbnN0IFBhZ2VMb2dvSWNvbiA9IHN0eWxlZChJY29uKWBcbiAgaGVpZ2h0OiBhdXRvO1xuYDtcblxuY29uc3QgTG9naW5CdXR0b24gPSBzdHlsZWQuYnV0dG9uYFxuICAke2J1dHRvbnMuYnV0dG9ufTtcbiAgJHtzaGFkb3dzLmRyb3BEZWVwfTtcbiAgJHtidXR0b25zLmRlZmF1bHR9O1xuICAke2J1dHRvbnMuZ3JheX07XG5cbiAgcGFkZGluZzogMCAzMHB4O1xuICBtYXJnaW4tdG9wOiAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG5cbiAgJHtJY29ufSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAxOHB4O1xuICB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRoZW50aWNhdGlvblBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIG9uTG9naW46IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgaW5Qcm9ncmVzczogUHJvcFR5cGVzLmJvb2wsXG4gICAgY29uZmlnOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgfTtcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAvKipcbiAgICAgKiBBbGxvdyBsb2dpbiBzY3JlZW4gdG8gYmUgc2tpcHBlZCBmb3IgZGVtbyBwdXJwb3Nlcy5cbiAgICAgKi9cbiAgICBjb25zdCBza2lwTG9naW4gPSB0aGlzLnByb3BzLmNvbmZpZy5iYWNrZW5kLmxvZ2luID09PSBmYWxzZTtcbiAgICBpZiAoc2tpcExvZ2luKSB7XG4gICAgICB0aGlzLnByb3BzLm9uTG9naW4odGhpcy5zdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlTG9naW4gPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5wcm9wcy5vbkxvZ2luKHRoaXMuc3RhdGUpO1xuICB9O1xuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGNvbmZpZywgaW5Qcm9ncmVzcywgdCB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8U3R5bGVkQXV0aGVudGljYXRpb25QYWdlPlxuICAgICAgICA8UGFnZUxvZ29JY29uIHNpemU9XCIzMDBweFwiIHR5cGU9XCJkZWNhcC1jbXNcIiAvPlxuICAgICAgICA8TG9naW5CdXR0b24gZGlzYWJsZWQ9e2luUHJvZ3Jlc3N9IG9uQ2xpY2s9e3RoaXMuaGFuZGxlTG9naW59PlxuICAgICAgICAgIHtpblByb2dyZXNzID8gdCgnYXV0aC5sb2dnaW5nSW4nKSA6IHQoJ2F1dGgubG9naW4nKX1cbiAgICAgICAgPC9Mb2dpbkJ1dHRvbj5cbiAgICAgICAge2NvbmZpZy5zaXRlX3VybCAmJiA8R29CYWNrQnV0dG9uIGhyZWY9e2NvbmZpZy5zaXRlX3VybH0gdD17dH0+PC9Hb0JhY2tCdXR0b24+fVxuICAgICAgPC9TdHlsZWRBdXRoZW50aWNhdGlvblBhZ2U+XG4gICAgKTtcbiAgfVxufVxuIl19 */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const LoginButton = (0, _styledBase.default)("button", {
  target: "e141mjkc2",
  label: "LoginButton"
})(_decapCmsUiDefault.buttons.button, ";", _decapCmsUiDefault.shadows.dropDeep, ";", _decapCmsUiDefault.buttons.default, ";", _decapCmsUiDefault.buttons.gray, ";padding:0 30px;margin-top:0;display:flex;align-items:center;position:relative;", _decapCmsUiDefault.Icon, "{margin-right:18px;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBa0JpQyIsImZpbGUiOiIuLi8uLi9zcmMvQXV0aGVudGljYXRpb25QYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyBJY29uLCBidXR0b25zLCBzaGFkb3dzLCBHb0JhY2tCdXR0b24gfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5cbmNvbnN0IFN0eWxlZEF1dGhlbnRpY2F0aW9uUGFnZSA9IHN0eWxlZC5zZWN0aW9uYFxuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWZsb3c6IGNvbHVtbiBub3dyYXA7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBnYXA6IDUwcHg7XG4gIGhlaWdodDogMTAwdmg7XG5gO1xuXG5jb25zdCBQYWdlTG9nb0ljb24gPSBzdHlsZWQoSWNvbilgXG4gIGhlaWdodDogYXV0bztcbmA7XG5cbmNvbnN0IExvZ2luQnV0dG9uID0gc3R5bGVkLmJ1dHRvbmBcbiAgJHtidXR0b25zLmJ1dHRvbn07XG4gICR7c2hhZG93cy5kcm9wRGVlcH07XG4gICR7YnV0dG9ucy5kZWZhdWx0fTtcbiAgJHtidXR0b25zLmdyYXl9O1xuXG4gIHBhZGRpbmc6IDAgMzBweDtcbiAgbWFyZ2luLXRvcDogMDtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuXG4gICR7SWNvbn0ge1xuICAgIG1hcmdpbi1yaWdodDogMThweDtcbiAgfVxuYDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXV0aGVudGljYXRpb25QYWdlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICBvbkxvZ2luOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIGluUHJvZ3Jlc3M6IFByb3BUeXBlcy5ib29sLFxuICAgIGNvbmZpZzogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIH07XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgLyoqXG4gICAgICogQWxsb3cgbG9naW4gc2NyZWVuIHRvIGJlIHNraXBwZWQgZm9yIGRlbW8gcHVycG9zZXMuXG4gICAgICovXG4gICAgY29uc3Qgc2tpcExvZ2luID0gdGhpcy5wcm9wcy5jb25maWcuYmFja2VuZC5sb2dpbiA9PT0gZmFsc2U7XG4gICAgaWYgKHNraXBMb2dpbikge1xuICAgICAgdGhpcy5wcm9wcy5vbkxvZ2luKHRoaXMuc3RhdGUpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUxvZ2luID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMucHJvcHMub25Mb2dpbih0aGlzLnN0YXRlKTtcbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb25maWcsIGluUHJvZ3Jlc3MsIHQgfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPFN0eWxlZEF1dGhlbnRpY2F0aW9uUGFnZT5cbiAgICAgICAgPFBhZ2VMb2dvSWNvbiBzaXplPVwiMzAwcHhcIiB0eXBlPVwiZGVjYXAtY21zXCIgLz5cbiAgICAgICAgPExvZ2luQnV0dG9uIGRpc2FibGVkPXtpblByb2dyZXNzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUxvZ2lufT5cbiAgICAgICAgICB7aW5Qcm9ncmVzcyA/IHQoJ2F1dGgubG9nZ2luZ0luJykgOiB0KCdhdXRoLmxvZ2luJyl9XG4gICAgICAgIDwvTG9naW5CdXR0b24+XG4gICAgICAgIHtjb25maWcuc2l0ZV91cmwgJiYgPEdvQmFja0J1dHRvbiBocmVmPXtjb25maWcuc2l0ZV91cmx9IHQ9e3R9PjwvR29CYWNrQnV0dG9uPn1cbiAgICAgIDwvU3R5bGVkQXV0aGVudGljYXRpb25QYWdlPlxuICAgICk7XG4gIH1cbn1cbiJdfQ== */"));
class AuthenticationPage extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "handleLogin", e => {
      e.preventDefault();
      this.props.onLogin(this.state);
    });
  }
  componentDidMount() {
    /**
     * Allow login screen to be skipped for demo purposes.
     */
    const skipLogin = this.props.config.backend.login === false;
    if (skipLogin) {
      this.props.onLogin(this.state);
    }
  }
  render() {
    const {
      config,
      inProgress,
      t
    } = this.props;
    return (0, _core.jsx)(StyledAuthenticationPage, null, (0, _core.jsx)(PageLogoIcon, {
      size: "300px",
      type: "decap-cms"
    }), (0, _core.jsx)(LoginButton, {
      disabled: inProgress,
      onClick: this.handleLogin
    }, inProgress ? t('auth.loggingIn') : t('auth.login')), config.site_url && (0, _core.jsx)(_decapCmsUiDefault.GoBackButton, {
      href: config.site_url,
      t: t
    }));
  }
}
exports.default = AuthenticationPage;
_defineProperty(AuthenticationPage, "propTypes", {
  onLogin: _propTypes.default.func.isRequired,
  inProgress: _propTypes.default.bool,
  config: _propTypes.default.object.isRequired,
  t: _propTypes.default.func.isRequired
});