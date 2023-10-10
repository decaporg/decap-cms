"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "AuthenticationPage", {
  enumerable: true,
  get: function () {
    return _AuthenticationPage.default;
  }
});
exports.DecapCmsBackendTest = void 0;
Object.defineProperty(exports, "TestBackend", {
  enumerable: true,
  get: function () {
    return _implementation.default;
  }
});
var _implementation = _interopRequireDefault(require("./implementation"));
var _AuthenticationPage = _interopRequireDefault(require("./AuthenticationPage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DecapCmsBackendTest = {
  TestBackend: _implementation.default,
  AuthenticationPage: _AuthenticationPage.default
};
exports.DecapCmsBackendTest = DecapCmsBackendTest;