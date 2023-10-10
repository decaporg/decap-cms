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
  target: "e1ektlme0",
  label: "StyledAuthenticationPage"
})(process.env.NODE_ENV === "production" ? {
  name: "1ul3gz4",
  styles: "display:flex;flex-flow:column nowrap;align-items:center;justify-content:center;height:100vh;"
} : {
  name: "1ul3gz4",
  styles: "display:flex;flex-flow:column nowrap;align-items:center;justify-content:center;height:100vh;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSytDIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEljb24sIGJ1dHRvbnMsIHNoYWRvd3MsIEdvQmFja0J1dHRvbiB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgU3R5bGVkQXV0aGVudGljYXRpb25QYWdlID0gc3R5bGVkLnNlY3Rpb25gXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZmxvdzogY29sdW1uIG5vd3JhcDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogMTAwdmg7XG5gO1xuXG5jb25zdCBQYWdlTG9nb0ljb24gPSBzdHlsZWQoSWNvbilgXG4gIGNvbG9yOiAjYzRjNmQyO1xuICBtYXJnaW4tdG9wOiAtMzAwcHg7XG5gO1xuXG5jb25zdCBMb2dpbkJ1dHRvbiA9IHN0eWxlZC5idXR0b25gXG4gICR7YnV0dG9ucy5idXR0b259O1xuICAke3NoYWRvd3MuZHJvcERlZXB9O1xuICAke2J1dHRvbnMuZGVmYXVsdH07XG4gICR7YnV0dG9ucy5ncmF5fTtcblxuICBwYWRkaW5nOiAwIDMwcHg7XG4gIG1hcmdpbi10b3A6IDA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcblxuICAke0ljb259IHtcbiAgICBtYXJnaW4tcmlnaHQ6IDE4cHg7XG4gIH1cbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dGhlbnRpY2F0aW9uUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgb25Mb2dpbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBpblByb2dyZXNzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICBjb25maWc6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB0OiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICB9O1xuXG4gIGhhbmRsZUxvZ2luID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMucHJvcHMub25Mb2dpbih0aGlzLnN0YXRlKTtcbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb25maWcsIGluUHJvZ3Jlc3MsIHQgfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPFN0eWxlZEF1dGhlbnRpY2F0aW9uUGFnZT5cbiAgICAgICAgPFBhZ2VMb2dvSWNvbiBzaXplPVwiMzAwcHhcIiB0eXBlPVwiZGVjYXAtY21zXCIgLz5cbiAgICAgICAgPExvZ2luQnV0dG9uIGRpc2FibGVkPXtpblByb2dyZXNzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUxvZ2lufT5cbiAgICAgICAgICB7aW5Qcm9ncmVzcyA/IHQoJ2F1dGgubG9nZ2luZ0luJykgOiB0KCdhdXRoLmxvZ2luJyl9XG4gICAgICAgIDwvTG9naW5CdXR0b24+XG4gICAgICAgIHtjb25maWcuc2l0ZV91cmwgJiYgPEdvQmFja0J1dHRvbiBocmVmPXtjb25maWcuc2l0ZV91cmx9IHQ9e3R9PjwvR29CYWNrQnV0dG9uPn1cbiAgICAgIDwvU3R5bGVkQXV0aGVudGljYXRpb25QYWdlPlxuICAgICk7XG4gIH1cbn1cbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const PageLogoIcon = ( /*#__PURE__*/0, _styledBase.default)(_decapCmsUiDefault.Icon, {
  target: "e1ektlme1",
  label: "PageLogoIcon"
})(process.env.NODE_ENV === "production" ? {
  name: "11nl61t",
  styles: "color:#c4c6d2;margin-top:-300px;"
} : {
  name: "11nl61t",
  styles: "color:#c4c6d2;margin-top:-300px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBYWlDIiwiZmlsZSI6Ii4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBzdHlsZWQgZnJvbSAnQGVtb3Rpb24vc3R5bGVkJztcbmltcG9ydCB7IEljb24sIGJ1dHRvbnMsIHNoYWRvd3MsIEdvQmFja0J1dHRvbiB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuY29uc3QgU3R5bGVkQXV0aGVudGljYXRpb25QYWdlID0gc3R5bGVkLnNlY3Rpb25gXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZmxvdzogY29sdW1uIG5vd3JhcDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogMTAwdmg7XG5gO1xuXG5jb25zdCBQYWdlTG9nb0ljb24gPSBzdHlsZWQoSWNvbilgXG4gIGNvbG9yOiAjYzRjNmQyO1xuICBtYXJnaW4tdG9wOiAtMzAwcHg7XG5gO1xuXG5jb25zdCBMb2dpbkJ1dHRvbiA9IHN0eWxlZC5idXR0b25gXG4gICR7YnV0dG9ucy5idXR0b259O1xuICAke3NoYWRvd3MuZHJvcERlZXB9O1xuICAke2J1dHRvbnMuZGVmYXVsdH07XG4gICR7YnV0dG9ucy5ncmF5fTtcblxuICBwYWRkaW5nOiAwIDMwcHg7XG4gIG1hcmdpbi10b3A6IDA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcblxuICAke0ljb259IHtcbiAgICBtYXJnaW4tcmlnaHQ6IDE4cHg7XG4gIH1cbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dGhlbnRpY2F0aW9uUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgb25Mb2dpbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBpblByb2dyZXNzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICBjb25maWc6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICB0OiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICB9O1xuXG4gIGhhbmRsZUxvZ2luID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMucHJvcHMub25Mb2dpbih0aGlzLnN0YXRlKTtcbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb25maWcsIGluUHJvZ3Jlc3MsIHQgfSA9IHRoaXMucHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPFN0eWxlZEF1dGhlbnRpY2F0aW9uUGFnZT5cbiAgICAgICAgPFBhZ2VMb2dvSWNvbiBzaXplPVwiMzAwcHhcIiB0eXBlPVwiZGVjYXAtY21zXCIgLz5cbiAgICAgICAgPExvZ2luQnV0dG9uIGRpc2FibGVkPXtpblByb2dyZXNzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUxvZ2lufT5cbiAgICAgICAgICB7aW5Qcm9ncmVzcyA/IHQoJ2F1dGgubG9nZ2luZ0luJykgOiB0KCdhdXRoLmxvZ2luJyl9XG4gICAgICAgIDwvTG9naW5CdXR0b24+XG4gICAgICAgIHtjb25maWcuc2l0ZV91cmwgJiYgPEdvQmFja0J1dHRvbiBocmVmPXtjb25maWcuc2l0ZV91cmx9IHQ9e3R9PjwvR29CYWNrQnV0dG9uPn1cbiAgICAgIDwvU3R5bGVkQXV0aGVudGljYXRpb25QYWdlPlxuICAgICk7XG4gIH1cbn1cbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
const LoginButton = (0, _styledBase.default)("button", {
  target: "e1ektlme2",
  label: "LoginButton"
})(_decapCmsUiDefault.buttons.button, ";", _decapCmsUiDefault.shadows.dropDeep, ";", _decapCmsUiDefault.buttons.default, ";", _decapCmsUiDefault.buttons.gray, ";padding:0 30px;margin-top:0;display:flex;align-items:center;position:relative;", _decapCmsUiDefault.Icon, "{margin-right:18px;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BdXRoZW50aWNhdGlvblBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBa0JpQyIsImZpbGUiOiIuLi8uLi9zcmMvQXV0aGVudGljYXRpb25QYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyBJY29uLCBidXR0b25zLCBzaGFkb3dzLCBHb0JhY2tCdXR0b24gfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5cbmNvbnN0IFN0eWxlZEF1dGhlbnRpY2F0aW9uUGFnZSA9IHN0eWxlZC5zZWN0aW9uYFxuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWZsb3c6IGNvbHVtbiBub3dyYXA7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBoZWlnaHQ6IDEwMHZoO1xuYDtcblxuY29uc3QgUGFnZUxvZ29JY29uID0gc3R5bGVkKEljb24pYFxuICBjb2xvcjogI2M0YzZkMjtcbiAgbWFyZ2luLXRvcDogLTMwMHB4O1xuYDtcblxuY29uc3QgTG9naW5CdXR0b24gPSBzdHlsZWQuYnV0dG9uYFxuICAke2J1dHRvbnMuYnV0dG9ufTtcbiAgJHtzaGFkb3dzLmRyb3BEZWVwfTtcbiAgJHtidXR0b25zLmRlZmF1bHR9O1xuICAke2J1dHRvbnMuZ3JheX07XG5cbiAgcGFkZGluZzogMCAzMHB4O1xuICBtYXJnaW4tdG9wOiAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG5cbiAgJHtJY29ufSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAxOHB4O1xuICB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRoZW50aWNhdGlvblBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIG9uTG9naW46IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgaW5Qcm9ncmVzczogUHJvcFR5cGVzLmJvb2wsXG4gICAgY29uZmlnOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgfTtcblxuICBoYW5kbGVMb2dpbiA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLnByb3BzLm9uTG9naW4odGhpcy5zdGF0ZSk7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgY29uZmlnLCBpblByb2dyZXNzLCB0IH0gPSB0aGlzLnByb3BzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxTdHlsZWRBdXRoZW50aWNhdGlvblBhZ2U+XG4gICAgICAgIDxQYWdlTG9nb0ljb24gc2l6ZT1cIjMwMHB4XCIgdHlwZT1cImRlY2FwLWNtc1wiIC8+XG4gICAgICAgIDxMb2dpbkJ1dHRvbiBkaXNhYmxlZD17aW5Qcm9ncmVzc30gb25DbGljaz17dGhpcy5oYW5kbGVMb2dpbn0+XG4gICAgICAgICAge2luUHJvZ3Jlc3MgPyB0KCdhdXRoLmxvZ2dpbmdJbicpIDogdCgnYXV0aC5sb2dpbicpfVxuICAgICAgICA8L0xvZ2luQnV0dG9uPlxuICAgICAgICB7Y29uZmlnLnNpdGVfdXJsICYmIDxHb0JhY2tCdXR0b24gaHJlZj17Y29uZmlnLnNpdGVfdXJsfSB0PXt0fT48L0dvQmFja0J1dHRvbj59XG4gICAgICA8L1N0eWxlZEF1dGhlbnRpY2F0aW9uUGFnZT5cbiAgICApO1xuICB9XG59XG4iXX0= */"));
class AuthenticationPage extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "handleLogin", e => {
      e.preventDefault();
      this.props.onLogin(this.state);
    });
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