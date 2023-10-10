"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _immutable = require("immutable");
var _curry = _interopRequireDefault(require("lodash/curry"));
var _flow = _interopRequireDefault(require("lodash/flow"));
var _isString = _interopRequireDefault(require("lodash/isString"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function isAbortControllerSupported() {
  if (typeof window !== 'undefined') {
    return !!window.AbortController;
  }
  return false;
}
const timeout = 60;
function fetchWithTimeout(input, init) {
  if (init && init.signal || !isAbortControllerSupported()) {
    return fetch(input, init);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
  return fetch(input, _objectSpread(_objectSpread({}, init), {}, {
    signal: controller.signal
  })).then(res => {
    clearTimeout(timeoutId);
    return res;
  }).catch(e => {
    if (e.name === 'AbortError' || e.name === 'DOMException') {
      throw new Error(`Request timed out after ${timeout} seconds`);
    }
    throw e;
  });
}
function decodeParams(paramsString) {
  return (0, _immutable.List)(paramsString.split('&')).map(s => (0, _immutable.List)(s.split('=')).map(decodeURIComponent)).update(_immutable.Map);
}
function fromURL(wholeURL) {
  const [url, allParamsString] = wholeURL.split('?');
  return (0, _immutable.Map)(_objectSpread({
    url
  }, allParamsString ? {
    params: decodeParams(allParamsString)
  } : {}));
}
function fromFetchArguments(wholeURL, options) {
  return fromURL(wholeURL).merge((options ? (0, _immutable.fromJS)(options) : (0, _immutable.Map)()).remove('url').remove('params'));
}
function encodeParams(params) {
  return params.entrySeq().map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}
function toURL(req) {
  return `${req.get('url')}${req.get('params') ? `?${encodeParams(req.get('params'))}` : ''}`;
}
function toFetchArguments(req) {
  return [toURL(req), req.remove('url').remove('params').toJS()];
}
function maybeRequestArg(req) {
  if ((0, _isString.default)(req)) {
    return fromURL(req);
  }
  if (req) {
    return (0, _immutable.fromJS)(req);
  }
  return (0, _immutable.Map)();
}
function ensureRequestArg(func) {
  return req => func(maybeRequestArg(req));
}
function ensureRequestArg2(func) {
  return (arg, req) => func(arg, maybeRequestArg(req));
}

// This actually performs the built request object
const performRequest = ensureRequestArg(req => {
  const args = toFetchArguments(req);
  return fetchWithTimeout(...args);
});

// Each of the following functions takes options and returns another
// function that performs the requested action on a request.
const getCurriedRequestProcessor = (0, _flow.default)([ensureRequestArg2, _curry.default]);
function getPropSetFunction(path) {
  return getCurriedRequestProcessor((val, req) => req.setIn(path, val));
}
function getPropMergeFunction(path) {
  return getCurriedRequestProcessor((obj, req) => req.updateIn(path, (p = (0, _immutable.Map)()) => p.merge(obj)));
}
const withMethod = getPropSetFunction(['method']);
const withBody = getPropSetFunction(['body']);
const withNoCache = getPropSetFunction(['cache'])('no-cache');
const withParams = getPropMergeFunction(['params']);
const withHeaders = getPropMergeFunction(['headers']);

// withRoot sets a root URL, unless the URL is already absolute
const absolutePath = new RegExp('^(?:[a-z]+:)?//', 'i');
const withRoot = getCurriedRequestProcessor((root, req) => req.update('url', p => {
  if (absolutePath.test(p)) {
    return p;
  }
  return root && p && p[0] !== '/' && root[root.length - 1] !== '/' ? `${root}/${p}` : `${root}${p}`;
}));
var _default = {
  toURL,
  fromURL,
  fromFetchArguments,
  performRequest,
  withMethod,
  withBody,
  withHeaders,
  withParams,
  withRoot,
  withNoCache,
  fetchWithTimeout
};
exports.default = _default;