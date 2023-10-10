"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _immutable = require("immutable");
var _trim = _interopRequireDefault(require("lodash/trim"));
var _trimEnd = _interopRequireDefault(require("lodash/trimEnd"));
var _utils = require("./utils");
const _excluded = ["access_token"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
class ImplicitAuthenticator {
  constructor(config = {}) {
    const baseURL = (0, _trimEnd.default)(config.base_url, '/');
    const authEndpoint = (0, _trim.default)(config.auth_endpoint, '/');
    this.auth_url = `${baseURL}/${authEndpoint}`;
    this.appID = config.app_id;
    this.clearHash = config.clearHash;
  }
  authenticate(options, cb) {
    if ((0, _utils.isInsecureProtocol)()) {
      return cb(new Error('Cannot authenticate over insecure protocol!'));
    }
    const authURL = new URL(this.auth_url);
    authURL.searchParams.set('client_id', this.appID);
    authURL.searchParams.set('redirect_uri', document.location.origin + document.location.pathname);
    authURL.searchParams.set('response_type', 'token');
    authURL.searchParams.set('scope', options.scope);
    if (options.prompt != null && options.prompt != undefined) {
      authURL.searchParams.set('prompt', options.prompt);
    }
    if (options.resource != null && options.resource != undefined) {
      authURL.searchParams.set('resource', options.resource);
    }
    const state = JSON.stringify({
      auth_type: 'implicit',
      nonce: (0, _utils.createNonce)()
    });
    authURL.searchParams.set('state', state);
    document.location.assign(authURL.href);
  }

  /**
   * Complete authentication if we were redirected back to from the provider.
   */
  completeAuth(cb) {
    const hashParams = new URLSearchParams(document.location.hash.replace(/^#?\/?/, ''));
    if (!hashParams.has('access_token') && !hashParams.has('error')) {
      return;
    }
    // Remove tokens from hash so that token does not remain in browser history.
    this.clearHash();
    const params = (0, _immutable.Map)(hashParams.entries());
    const {
      nonce
    } = JSON.parse(params.get('state'));
    const validNonce = (0, _utils.validateNonce)(nonce);
    if (!validNonce) {
      return cb(new Error('Invalid nonce'));
    }
    if (params.has('error')) {
      return cb(new Error(`${params.get('error')}: ${params.get('error_description')}`));
    }
    if (params.has('access_token')) {
      const _params$toJS = params.toJS(),
        {
          access_token: token
        } = _params$toJS,
        data = _objectWithoutProperties(_params$toJS, _excluded);
      cb(null, _objectSpread({
        token
      }, data));
    }
  }
}
exports.default = ImplicitAuthenticator;