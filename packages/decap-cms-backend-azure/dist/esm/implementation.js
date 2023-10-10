"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _trim2 = _interopRequireDefault(require("lodash/trim"));
var _trimStart2 = _interopRequireDefault(require("lodash/trimStart"));
var _semaphore = _interopRequireDefault(require("semaphore"));
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _AuthenticationPage = _interopRequireDefault(require("./AuthenticationPage"));
var _API = _interopRequireWildcard(require("./API"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const MAX_CONCURRENT_DOWNLOADS = 10;
function parseAzureRepo(config) {
  const {
    repo
  } = config.backend;
  if (typeof repo !== 'string') {
    throw new Error('The Azure backend needs a "repo" in the backend configuration.');
  }
  const parts = repo.split('/');
  if (parts.length !== 3) {
    throw new Error('The Azure backend must be in a the format of {org}/{project}/{repo}');
  }
  const [org, project, repoName] = parts;
  return {
    org,
    project,
    repoName
  };
}
class Azure {
  constructor(config, options = {}) {
    _defineProperty(this, "lock", void 0);
    _defineProperty(this, "api", void 0);
    _defineProperty(this, "options", void 0);
    _defineProperty(this, "repo", void 0);
    _defineProperty(this, "branch", void 0);
    _defineProperty(this, "apiRoot", void 0);
    _defineProperty(this, "apiVersion", void 0);
    _defineProperty(this, "token", void 0);
    _defineProperty(this, "squashMerges", void 0);
    _defineProperty(this, "cmsLabelPrefix", void 0);
    _defineProperty(this, "mediaFolder", void 0);
    _defineProperty(this, "previewContext", void 0);
    _defineProperty(this, "_mediaDisplayURLSem", void 0);
    this.options = _objectSpread({
      initialWorkflowStatus: ''
    }, options);
    this.repo = parseAzureRepo(config);
    this.branch = config.backend.branch || 'master';
    this.apiRoot = config.backend.api_root || 'https://dev.azure.com';
    this.apiVersion = config.backend.api_version || '6.1-preview';
    this.token = '';
    this.squashMerges = config.backend.squash_merges || false;
    this.cmsLabelPrefix = config.backend.cms_label_prefix || '';
    this.mediaFolder = (0, _trim2.default)(config.media_folder, '/');
    this.previewContext = config.backend.preview_context || '';
    this.lock = (0, _decapCmsLibUtil.asyncLock)();
  }
  isGitBackend() {
    return true;
  }
  async status() {
    const auth = (await this.api.user().then(user => !!user).catch(e => {
      console.warn('Failed getting Azure user', e);
      return false;
    })) || false;
    return {
      auth: {
        status: auth
      },
      api: {
        status: true,
        statusPage: ''
      }
    };
  }
  authComponent() {
    return _AuthenticationPage.default;
  }
  restoreUser(user) {
    return this.authenticate(user);
  }
  async authenticate(state) {
    this.token = state.token;
    this.api = new _API.default({
      apiRoot: this.apiRoot,
      apiVersion: this.apiVersion,
      repo: this.repo,
      branch: this.branch,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus
    }, this.token);
    const user = await this.api.user();
    return _objectSpread({
      token: state.token
    }, user);
  }

  /**
   * Log the user out by forgetting their access token.
   * TODO: *Actual* logout by redirecting to:
   * https://login.microsoftonline.com/{tenantId}/oauth2/logout?client_id={clientId}&post_logout_redirect_uri={baseUrl}
   */
  logout() {
    this.token = null;
    return;
  }
  getToken() {
    return Promise.resolve(this.token);
  }
  async entriesByFolder(folder, extension, depth) {
    const listFiles = async () => {
      const files = await this.api.listFiles(folder, depth > 1);
      const filtered = files.filter(file => (0, _decapCmsLibUtil.filterByExtension)({
        path: file.path
      }, extension));
      return filtered.map(file => ({
        id: file.id,
        path: file.path
      }));
    };
    const entries = await (0, _decapCmsLibUtil.entriesByFolder)(listFiles, this.api.readFile.bind(this.api), this.api.readFileMetadata.bind(this.api), _API.API_NAME);
    return entries;
  }
  entriesByFiles(files) {
    return (0, _decapCmsLibUtil.entriesByFiles)(files, this.api.readFile.bind(this.api), this.api.readFileMetadata.bind(this.api), _API.API_NAME);
  }
  async getEntry(path) {
    const data = await this.api.readFile(path);
    return {
      file: {
        path
      },
      data
    };
  }
  async getMedia() {
    const files = await this.api.listFiles(this.mediaFolder, false);
    const mediaFiles = await Promise.all(files.map(async ({
      id,
      path,
      name
    }) => {
      const blobUrl = await this.getMediaDisplayURL({
        id,
        path
      });
      return {
        id,
        name,
        displayURL: blobUrl,
        path
      };
    }));
    return mediaFiles;
  }
  getMediaDisplayURL(displayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || (0, _semaphore.default)(MAX_CONCURRENT_DOWNLOADS);
    return (0, _decapCmsLibUtil.getMediaDisplayURL)(displayURL, this.api.readFile.bind(this.api), this._mediaDisplayURLSem);
  }
  async getMediaFile(path) {
    const name = (0, _decapCmsLibUtil.basename)(path);
    const blob = await (0, _decapCmsLibUtil.getMediaAsBlob)(path, null, this.api.readFile.bind(this.api));
    const fileObj = new File([blob], name);
    const url = URL.createObjectURL(fileObj);
    const id = await (0, _decapCmsLibUtil.getBlobSHA)(blob);
    return {
      id,
      displayURL: url,
      path,
      name,
      size: fileObj.size,
      file: fileObj,
      url
    };
  }
  async persistEntry(entry, options) {
    const mediaFiles = entry.assets;
    await this.api.persistFiles(entry.dataFiles, mediaFiles, options);
  }
  async persistMedia(mediaFile, options) {
    const fileObj = mediaFile.fileObj;
    const [id] = await Promise.all([(0, _decapCmsLibUtil.getBlobSHA)(fileObj), this.api.persistFiles([], [mediaFile], options)]);
    const {
      path
    } = mediaFile;
    const url = URL.createObjectURL(fileObj);
    return {
      displayURL: url,
      path: (0, _trimStart2.default)(path, '/'),
      name: fileObj.name,
      size: fileObj.size,
      file: fileObj,
      url,
      id: id
    };
  }
  async deleteFiles(paths, commitMessage) {
    await this.api.deleteFiles(paths, commitMessage);
  }
  async loadMediaFile(branch, file) {
    const readFile = (path, id, {
      parseText
    }) => this.api.readFile(path, id, {
      branch,
      parseText
    });
    const blob = await (0, _decapCmsLibUtil.getMediaAsBlob)(file.path, null, readFile);
    const name = (0, _decapCmsLibUtil.basename)(file.path);
    const fileObj = new File([blob], name);
    return {
      id: file.path,
      displayURL: URL.createObjectURL(fileObj),
      path: file.path,
      name,
      size: fileObj.size,
      file: fileObj
    };
  }
  async loadEntryMediaFiles(branch, files) {
    const mediaFiles = await Promise.all(files.map(file => this.loadMediaFile(branch, file)));
    return mediaFiles;
  }
  async unpublishedEntries() {
    const listEntriesKeys = () => this.api.listUnpublishedBranches().then(branches => branches.map(branch => (0, _decapCmsLibUtil.contentKeyFromBranch)(branch)));
    const ids = await (0, _decapCmsLibUtil.unpublishedEntries)(listEntriesKeys);
    return ids;
  }
  async unpublishedEntry({
    id,
    collection,
    slug
  }) {
    if (id) {
      const data = await this.api.retrieveUnpublishedEntryData(id);
      return data;
    } else if (collection && slug) {
      const contentKey = (0, _decapCmsLibUtil.generateContentKey)(collection, slug);
      const data = await this.api.retrieveUnpublishedEntryData(contentKey);
      return data;
    } else {
      throw new Error('Missing unpublished entry id or collection and slug');
    }
  }
  getBranch(collection, slug) {
    const contentKey = (0, _decapCmsLibUtil.generateContentKey)(collection, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    return branch;
  }
  async unpublishedEntryMediaFile(collection, slug, path, id) {
    const branch = this.getBranch(collection, slug);
    const mediaFile = await this.loadMediaFile(branch, {
      path,
      id
    });
    return mediaFile;
  }
  async unpublishedEntryDataFile(collection, slug, path, id) {
    const branch = this.getBranch(collection, slug);
    const data = await this.api.readFile(path, id, {
      branch
    });
    return data;
  }
  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    // updateUnpublishedEntryStatus is a transactional operation
    return (0, _decapCmsLibUtil.runWithLock)(this.lock, () => this.api.updateUnpublishedEntryStatus(collection, slug, newStatus), 'Failed to acquire update entry status lock');
  }
  deleteUnpublishedEntry(collection, slug) {
    // deleteUnpublishedEntry is a transactional operation
    return (0, _decapCmsLibUtil.runWithLock)(this.lock, () => this.api.deleteUnpublishedEntry(collection, slug), 'Failed to acquire delete entry lock');
  }
  publishUnpublishedEntry(collection, slug) {
    // publishUnpublishedEntry is a transactional operation
    return (0, _decapCmsLibUtil.runWithLock)(this.lock, () => this.api.publishUnpublishedEntry(collection, slug), 'Failed to acquire publish entry lock');
  }
  async getDeployPreview(collection, slug) {
    try {
      const statuses = await this.api.getStatuses(collection, slug);
      const deployStatus = (0, _decapCmsLibUtil.getPreviewStatus)(statuses, this.previewContext);
      if (deployStatus) {
        const {
          target_url: url,
          state
        } = deployStatus;
        return {
          url,
          status: state
        };
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}
exports.default = Azure;