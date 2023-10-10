"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _AuthenticationPage = _interopRequireDefault(require("./AuthenticationPage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
async function serializeAsset(assetProxy) {
  const base64content = await assetProxy.toBase64();
  return {
    path: assetProxy.path,
    content: base64content,
    encoding: 'base64'
  };
}
function deserializeMediaFile({
  id,
  content,
  encoding,
  path,
  name
}) {
  let byteArray = new Uint8Array(0);
  if (encoding !== 'base64') {
    console.error(`Unsupported encoding '${encoding}' for file '${path}'`);
  } else {
    const decodedContent = atob(content);
    byteArray = new Uint8Array(decodedContent.length);
    for (let i = 0; i < decodedContent.length; i++) {
      byteArray[i] = decodedContent.charCodeAt(i);
    }
  }
  const blob = new Blob([byteArray]);
  const file = (0, _decapCmsLibUtil.blobToFileObj)(name, blob);
  const url = URL.createObjectURL(file);
  return {
    id,
    name,
    path,
    file,
    size: file.size,
    url,
    displayURL: url
  };
}
class ProxyBackend {
  constructor(config, options = {}) {
    _defineProperty(this, "proxyUrl", void 0);
    _defineProperty(this, "mediaFolder", void 0);
    _defineProperty(this, "options", void 0);
    _defineProperty(this, "branch", void 0);
    _defineProperty(this, "cmsLabelPrefix", void 0);
    if (!config.backend.proxy_url) {
      throw new Error('The Proxy backend needs a "proxy_url" in the backend configuration.');
    }
    this.branch = config.backend.branch || 'master';
    this.proxyUrl = config.backend.proxy_url;
    this.mediaFolder = config.media_folder;
    this.options = options;
    this.cmsLabelPrefix = config.backend.cms_label_prefix;
  }
  isGitBackend() {
    return false;
  }
  status() {
    return Promise.resolve({
      auth: {
        status: true
      },
      api: {
        status: true,
        statusPage: ''
      }
    });
  }
  authComponent() {
    return _AuthenticationPage.default;
  }
  restoreUser() {
    return this.authenticate();
  }
  authenticate() {
    return Promise.resolve();
  }
  logout() {
    return null;
  }
  getToken() {
    return Promise.resolve('');
  }
  async request(payload) {
    const response = await _decapCmsLibUtil.unsentRequest.fetchWithTimeout(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(_objectSpread({
        branch: this.branch
      }, payload))
    });
    const json = await response.json();
    if (response.ok) {
      return json;
    } else {
      throw new _decapCmsLibUtil.APIError(json.error, response.status, 'Proxy');
    }
  }
  entriesByFolder(folder, extension, depth) {
    return this.request({
      action: 'entriesByFolder',
      params: {
        branch: this.branch,
        folder,
        extension,
        depth
      }
    });
  }
  entriesByFiles(files) {
    return this.request({
      action: 'entriesByFiles',
      params: {
        branch: this.branch,
        files
      }
    });
  }
  getEntry(path) {
    return this.request({
      action: 'getEntry',
      params: {
        branch: this.branch,
        path
      }
    });
  }
  unpublishedEntries() {
    return this.request({
      action: 'unpublishedEntries',
      params: {
        branch: this.branch
      }
    });
  }
  async unpublishedEntry({
    id,
    collection,
    slug
  }) {
    try {
      const entry = await this.request({
        action: 'unpublishedEntry',
        params: {
          branch: this.branch,
          id,
          collection,
          slug,
          cmsLabelPrefix: this.cmsLabelPrefix
        }
      });
      return entry;
    } catch (e) {
      if (e.status === 404) {
        throw new _decapCmsLibUtil.EditorialWorkflowError('content is not under editorial workflow', true);
      }
      throw e;
    }
  }
  async unpublishedEntryDataFile(collection, slug, path, id) {
    const {
      data
    } = await this.request({
      action: 'unpublishedEntryDataFile',
      params: {
        branch: this.branch,
        collection,
        slug,
        path,
        id
      }
    });
    return data;
  }
  async unpublishedEntryMediaFile(collection, slug, path, id) {
    const file = await this.request({
      action: 'unpublishedEntryMediaFile',
      params: {
        branch: this.branch,
        collection,
        slug,
        path,
        id
      }
    });
    return deserializeMediaFile(file);
  }
  deleteUnpublishedEntry(collection, slug) {
    return this.request({
      action: 'deleteUnpublishedEntry',
      params: {
        branch: this.branch,
        collection,
        slug
      }
    });
  }
  async persistEntry(entry, options) {
    const assets = await Promise.all(entry.assets.map(serializeAsset));
    return this.request({
      action: 'persistEntry',
      params: {
        branch: this.branch,
        dataFiles: entry.dataFiles,
        assets,
        options: _objectSpread(_objectSpread({}, options), {}, {
          status: options.status || this.options.initialWorkflowStatus
        }),
        cmsLabelPrefix: this.cmsLabelPrefix
      }
    });
  }
  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.request({
      action: 'updateUnpublishedEntryStatus',
      params: {
        branch: this.branch,
        collection,
        slug,
        newStatus,
        cmsLabelPrefix: this.cmsLabelPrefix
      }
    });
  }
  publishUnpublishedEntry(collection, slug) {
    return this.request({
      action: 'publishUnpublishedEntry',
      params: {
        branch: this.branch,
        collection,
        slug
      }
    });
  }
  async getMedia(mediaFolder = this.mediaFolder) {
    const files = await this.request({
      action: 'getMedia',
      params: {
        branch: this.branch,
        mediaFolder
      }
    });
    return files.map(deserializeMediaFile);
  }
  async getMediaFile(path) {
    const file = await this.request({
      action: 'getMediaFile',
      params: {
        branch: this.branch,
        path
      }
    });
    return deserializeMediaFile(file);
  }
  async persistMedia(assetProxy, options) {
    const asset = await serializeAsset(assetProxy);
    const file = await this.request({
      action: 'persistMedia',
      params: {
        branch: this.branch,
        asset,
        options: {
          commitMessage: options.commitMessage
        }
      }
    });
    return deserializeMediaFile(file);
  }
  deleteFiles(paths, commitMessage) {
    return this.request({
      action: 'deleteFiles',
      params: {
        branch: this.branch,
        paths,
        options: {
          commitMessage
        }
      }
    });
  }
  getDeployPreview(collection, slug) {
    return this.request({
      action: 'getDeployPreview',
      params: {
        branch: this.branch,
        collection,
        slug
      }
    });
  }
}
exports.default = ProxyBackend;