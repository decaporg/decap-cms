"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getClient = getClient;
exports.matchPath = matchPath;
var _isEmpty2 = _interopRequireDefault(require("lodash/isEmpty"));
var _isPlainObject2 = _interopRequireDefault(require("lodash/isPlainObject"));
var _map2 = _interopRequireDefault(require("lodash/fp/map"));
var _fromPairs2 = _interopRequireDefault(require("lodash/fp/fromPairs"));
var _flow2 = _interopRequireDefault(require("lodash/fp/flow"));
var _minimatch = _interopRequireDefault(require("minimatch"));
var _decapCmsLibUtil = require("decap-cms-lib-util");
const _excluded = ["sha"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function matchPath({
  patterns
}, path) {
  return patterns.some(pattern => (0, _minimatch.default)(path, pattern, {
    matchBase: true
  }));
}

//
// API interactions

const defaultContentHeaders = {
  Accept: 'application/vnd.git-lfs+json',
  ['Content-Type']: 'application/vnd.git-lfs+json'
};
async function resourceExists({
  rootURL,
  makeAuthorizedRequest
}, {
  sha,
  size
}) {
  const response = await makeAuthorizedRequest({
    url: `${rootURL}/verify`,
    method: 'POST',
    headers: defaultContentHeaders,
    body: JSON.stringify({
      oid: sha,
      size
    })
  });
  if (response.ok) {
    return true;
  }
  if (response.status === 404) {
    return false;
  }

  // TODO: what kind of error to throw here? APIError doesn't seem
  // to fit
}

function getTransofrmationsParams(t) {
  if ((0, _isPlainObject2.default)(t) && !(0, _isEmpty2.default)(t)) {
    const {
      nf_resize: resize,
      w,
      h
    } = t;
    return `?nf_resize=${resize}&w=${w}&h=${h}`;
  }
  return '';
}
async function getDownloadURL({
  rootURL,
  transformImages: t,
  makeAuthorizedRequest
}, {
  sha
}) {
  try {
    const transformation = getTransofrmationsParams(t);
    const transformedPromise = makeAuthorizedRequest(`${rootURL}/origin/${sha}${transformation}`);
    const [transformed, original] = await Promise.all([transformedPromise,
    // if transformation is defined, we need to load the original so we have the correct meta data
    transformation ? makeAuthorizedRequest(`${rootURL}/origin/${sha}`) : transformedPromise]);
    if (!transformed.ok) {
      const error = await transformed.json();
      throw new Error(`Failed getting large media for sha '${sha}': '${error.code} - ${error.msg}'`);
    }
    const transformedBlob = await transformed.blob();
    const url = URL.createObjectURL(transformedBlob);
    return {
      url,
      blob: transformation ? await original.blob() : transformedBlob
    };
  } catch (error) {
    console.error(error);
    return {
      url: '',
      blob: new Blob()
    };
  }
}
function uploadOperation(objects) {
  return {
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
  };
}
async function getResourceUploadURLs({
  rootURL,
  makeAuthorizedRequest
}, pointerFiles) {
  const response = await makeAuthorizedRequest({
    url: `${rootURL}/objects/batch`,
    method: 'POST',
    headers: defaultContentHeaders,
    body: JSON.stringify(uploadOperation(pointerFiles))
  });
  const {
    objects
  } = await response.json();
  const uploadUrls = objects.map(object => {
    if (object.error) {
      throw new Error(object.error.message);
    }
    return object.actions.upload.href;
  });
  return uploadUrls;
}
function uploadBlob(uploadURL, blob) {
  return _decapCmsLibUtil.unsentRequest.fetchWithTimeout(uploadURL, {
    method: 'PUT',
    body: blob
  });
}
async function uploadResource(clientConfig, {
  sha,
  size
}, resource) {
  const existingFile = await resourceExists(clientConfig, {
    sha,
    size
  });
  if (existingFile) {
    return sha;
  }
  const [uploadURL] = await getResourceUploadURLs(clientConfig, [{
    sha,
    size
  }]);
  await uploadBlob(uploadURL, resource);
  return sha;
}

//
// Create Large Media client

function configureFn(config, fn) {
  return (...args) => fn(config, ...args);
}
const clientFns = {
  resourceExists,
  getResourceUploadURLs,
  getDownloadURL,
  uploadResource,
  matchPath
};
function getClient(clientConfig) {
  return (0, _flow2.default)([Object.keys, (0, _map2.default)(key => [key, configureFn(clientConfig, clientFns[key])]), _fromPairs2.default, configuredFns => _objectSpread(_objectSpread({}, configuredFns), {}, {
    patterns: clientConfig.patterns,
    enabled: clientConfig.enabled
  })])(clientFns);
}