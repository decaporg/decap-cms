"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GitLfsClient = void 0;
var _minimatch = _interopRequireDefault(require("minimatch"));
var _decapCmsLibUtil = require("decap-cms-lib-util");
const _excluded = ["sha"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
class GitLfsClient {
  constructor(enabled, rootURL, patterns, makeAuthorizedRequest) {
    this.enabled = enabled;
    this.rootURL = rootURL;
    this.patterns = patterns;
    this.makeAuthorizedRequest = makeAuthorizedRequest;
  }
  matchPath(path) {
    return this.patterns.some(pattern => (0, _minimatch.default)(path, pattern, {
      matchBase: true
    }));
  }
  async uploadResource(pointer, resource) {
    const requests = await this.getResourceUploadRequests([pointer]);
    for (const request of requests) {
      await this.doUpload(request.actions.upload, resource);
      if (request.actions.verify) {
        await this.doVerify(request.actions.verify, request);
      }
    }
    return pointer.sha;
  }
  async doUpload(upload, resource) {
    await _decapCmsLibUtil.unsentRequest.fetchWithTimeout(decodeURI(upload.href), {
      method: 'PUT',
      body: resource,
      headers: upload.header
    });
  }
  async doVerify(verify, object) {
    this.makeAuthorizedRequest({
      url: decodeURI(verify.href),
      method: 'POST',
      headers: _objectSpread(_objectSpread({}, GitLfsClient.defaultContentHeaders), verify.header),
      body: JSON.stringify({
        oid: object.oid,
        size: object.size
      })
    });
  }
  async getResourceUploadRequests(objects) {
    const response = await this.makeAuthorizedRequest({
      url: `${this.rootURL}/objects/batch`,
      method: 'POST',
      headers: GitLfsClient.defaultContentHeaders,
      body: JSON.stringify({
        operation: 'upload',
        transfers: ['basic'],
        objects: objects.map(_ref => {
          let {
              sha
            } = _ref,
            rest = _objectWithoutProperties(_ref, _excluded);
          return _objectSpread(_objectSpread({}, rest), {}, {
            oid: sha
          });
        })
      })
    });
    return (await response.json()).objects.filter(object => {
      if ('error' in object) {
        console.error(object.error);
        return false;
      }
      return object.actions;
    });
  }
}
exports.GitLfsClient = GitLfsClient;
_defineProperty(GitLfsClient, "defaultContentHeaders", {
  Accept: 'application/vnd.git-lfs+json',
  ['Content-Type']: 'application/vnd.git-lfs+json'
});