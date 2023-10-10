"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "API", {
  enumerable: true,
  get: function () {
    return _API.default;
  }
});
Object.defineProperty(exports, "AuthenticationPage", {
  enumerable: true,
  get: function () {
    return _AuthenticationPage.default;
  }
});
exports.DecapCmsBackendGitlab = void 0;
Object.defineProperty(exports, "GitLabBackend", {
  enumerable: true,
  get: function () {
    return _implementation.default;
  }
});
var _implementation = _interopRequireDefault(require("./implementation"));
var _API = _interopRequireDefault(require("./API"));
var _AuthenticationPage = _interopRequireDefault(require("./AuthenticationPage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DecapCmsBackendGitlab = {
  GitLabBackend: _implementation.default,
  API: _API.default,
  AuthenticationPage: _AuthenticationPage.default
};
exports.DecapCmsBackendGitlab = DecapCmsBackendGitlab;