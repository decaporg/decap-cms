"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _trimStart2 = _interopRequireDefault(require("lodash/trimStart"));
var _semaphore = _interopRequireDefault(require("semaphore"));
var _commonTags = require("common-tags");
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _decapCmsLibAuth = require("decap-cms-lib-auth");
var _AuthenticationPage = _interopRequireDefault(require("./AuthenticationPage"));
var _API = _interopRequireWildcard(require("./API"));
var _gitLfsClient = require("./git-lfs-client");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const MAX_CONCURRENT_DOWNLOADS = 10;
const STATUS_PAGE = 'https://bitbucket.status.atlassian.com';
const BITBUCKET_STATUS_ENDPOINT = `${STATUS_PAGE}/api/v2/components.json`;
const BITBUCKET_OPERATIONAL_UNITS = ['API', 'Authentication and user management', 'Git LFS'];
// Implementation wrapper class
class BitbucketBackend {
  constructor(config, options = {}) {
    _defineProperty(this, "lock", void 0);
    _defineProperty(this, "api", void 0);
    _defineProperty(this, "updateUserCredentials", void 0);
    _defineProperty(this, "options", void 0);
    _defineProperty(this, "repo", void 0);
    _defineProperty(this, "branch", void 0);
    _defineProperty(this, "apiRoot", void 0);
    _defineProperty(this, "baseUrl", void 0);
    _defineProperty(this, "siteId", void 0);
    _defineProperty(this, "token", void 0);
    _defineProperty(this, "mediaFolder", void 0);
    _defineProperty(this, "refreshToken", void 0);
    _defineProperty(this, "refreshedTokenPromise", void 0);
    _defineProperty(this, "authenticator", void 0);
    _defineProperty(this, "_mediaDisplayURLSem", void 0);
    _defineProperty(this, "squashMerges", void 0);
    _defineProperty(this, "cmsLabelPrefix", void 0);
    _defineProperty(this, "previewContext", void 0);
    _defineProperty(this, "largeMediaURL", void 0);
    _defineProperty(this, "_largeMediaClientPromise", void 0);
    _defineProperty(this, "authType", void 0);
    _defineProperty(this, "requestFunction", async req => {
      const token = await this.getToken();
      const authorizedRequest = _decapCmsLibUtil.unsentRequest.withHeaders({
        Authorization: `Bearer ${token}`
      }, req);
      return _decapCmsLibUtil.unsentRequest.performRequest(authorizedRequest);
    });
    _defineProperty(this, "apiRequestFunction", async req => {
      const token = this.refreshedTokenPromise ? await this.refreshedTokenPromise : this.token;
      const authorizedRequest = _decapCmsLibUtil.unsentRequest.withHeaders({
        Authorization: `Bearer ${token}`
      }, req);
      const response = await _decapCmsLibUtil.unsentRequest.performRequest(authorizedRequest);
      if (response.status === 401) {
        const json = await response.json().catch(() => null);
        if (json && json.type === 'error' && /^access token expired/i.test(json.error.message)) {
          const newToken = await this.getRefreshedAccessToken();
          const reqWithNewToken = _decapCmsLibUtil.unsentRequest.withHeaders({
            Authorization: `Bearer ${newToken}`
          }, req);
          return _decapCmsLibUtil.unsentRequest.performRequest(reqWithNewToken);
        }
      }
      return response;
    });
    this.options = _objectSpread({
      proxied: false,
      API: null,
      updateUserCredentials: async () => null,
      initialWorkflowStatus: ''
    }, options);
    if (!this.options.proxied && (config.backend.repo === null || config.backend.repo === undefined)) {
      throw new Error('The BitBucket backend needs a "repo" in the backend configuration.');
    }
    this.api = this.options.API || null;
    this.updateUserCredentials = this.options.updateUserCredentials;
    this.repo = config.backend.repo || '';
    this.branch = config.backend.branch || 'master';
    this.apiRoot = config.backend.api_root || 'https://api.bitbucket.org/2.0';
    this.baseUrl = config.base_url || '';
    this.siteId = config.site_id || '';
    this.largeMediaURL = config.backend.large_media_url || `https://bitbucket.org/${config.backend.repo}/info/lfs`;
    this.token = '';
    this.mediaFolder = config.media_folder;
    this.squashMerges = config.backend.squash_merges || false;
    this.cmsLabelPrefix = config.backend.cms_label_prefix || '';
    this.previewContext = config.backend.preview_context || '';
    this.lock = (0, _decapCmsLibUtil.asyncLock)();
    this.authType = config.backend.auth_type || '';
  }
  isGitBackend() {
    return true;
  }
  async status() {
    const api = await fetch(BITBUCKET_STATUS_ENDPOINT).then(res => res.json()).then(res => {
      return res['components'].filter(statusComponent => BITBUCKET_OPERATIONAL_UNITS.includes(statusComponent.name)).every(statusComponent => statusComponent.status === 'operational');
    }).catch(e => {
      console.warn('Failed getting BitBucket status', e);
      return true;
    });
    let auth = false;
    // no need to check auth if api is down
    if (api) {
      var _this$api;
      auth = (await ((_this$api = this.api) === null || _this$api === void 0 ? void 0 : _this$api.user().then(user => !!user).catch(e => {
        console.warn('Failed getting Bitbucket user', e);
        return false;
      }))) || false;
    }
    return {
      auth: {
        status: auth
      },
      api: {
        status: api,
        statusPage: STATUS_PAGE
      }
    };
  }
  authComponent() {
    return _AuthenticationPage.default;
  }
  setUser(user) {
    this.token = user.token;
    this.api = new _API.default({
      requestFunction: this.apiRequestFunction,
      branch: this.branch,
      repo: this.repo,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus
    });
  }
  restoreUser(user) {
    return this.authenticate(user);
  }
  async authenticate(state) {
    this.token = state.token;
    this.refreshToken = state.refresh_token;
    this.api = new _API.default({
      requestFunction: this.apiRequestFunction,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus
    });
    const isCollab = await this.api.hasWriteAccess().catch(error => {
      error.message = (0, _commonTags.stripIndent)`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a Bitbucket account with access.
      `;
      throw error;
    });

    // Unauthorized user
    if (!isCollab) {
      throw new Error('Your BitBucket user account does not have access to this repo.');
    }
    const user = await this.api.user();

    // Authorized user
    return _objectSpread(_objectSpread({}, user), {}, {
      name: user.display_name,
      login: user.username,
      token: state.token,
      avatar_url: user.links.avatar.href,
      refresh_token: state.refresh_token
    });
  }
  getRefreshedAccessToken() {
    if (this.authType === 'implicit') {
      throw new _decapCmsLibUtil.AccessTokenError(`Can't refresh access token when using implicit auth`);
    }
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }

    // instantiating a new Authenticator on each refresh isn't ideal,
    if (!this.authenticator) {
      const cfg = {
        base_url: this.baseUrl,
        site_id: this.siteId
      };
      this.authenticator = new _decapCmsLibAuth.NetlifyAuthenticator(cfg);
    }
    this.refreshedTokenPromise = this.authenticator.refresh({
      provider: 'bitbucket',
      refresh_token: this.refreshToken
    }).then(({
      token,
      refresh_token
    }) => {
      this.token = token;
      this.refreshToken = refresh_token;
      this.refreshedTokenPromise = undefined;
      this.updateUserCredentials({
        token,
        refresh_token
      });
      return token;
    });
    return this.refreshedTokenPromise;
  }
  logout() {
    this.token = null;
    return;
  }
  getToken() {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }
    return Promise.resolve(this.token);
  }
  async entriesByFolder(folder, extension, depth) {
    let cursor;
    const listFiles = () => this.api.listFiles(folder, depth, 20, this.branch).then(({
      entries,
      cursor: c
    }) => {
      cursor = c.mergeMeta({
        extension
      });
      return entries.filter(e => (0, _decapCmsLibUtil.filterByExtension)(e, extension));
    });
    const head = await this.api.defaultBranchCommitSha();
    const readFile = (path, id) => {
      return this.api.readFile(path, id, {
        head
      });
    };
    const files = await (0, _decapCmsLibUtil.entriesByFolder)(listFiles, readFile, this.api.readFileMetadata.bind(this.api), _API.API_NAME);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    files[_decapCmsLibUtil.CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return files;
  }
  async listAllFiles(folder, extension, depth) {
    const files = await this.api.listAllFiles(folder, depth, this.branch);
    const filtered = files.filter(file => (0, _decapCmsLibUtil.filterByExtension)(file, extension));
    return filtered;
  }
  async allEntriesByFolder(folder, extension, depth) {
    const head = await this.api.defaultBranchCommitSha();
    const readFile = (path, id) => {
      return this.api.readFile(path, id, {
        head
      });
    };
    const files = await (0, _decapCmsLibUtil.allEntriesByFolder)({
      listAllFiles: () => this.listAllFiles(folder, extension, depth),
      readFile,
      readFileMetadata: this.api.readFileMetadata.bind(this.api),
      apiName: _API.API_NAME,
      branch: this.branch,
      localForage: _decapCmsLibUtil.localForage,
      folder,
      extension,
      depth,
      getDefaultBranch: () => Promise.resolve({
        name: this.branch,
        sha: head
      }),
      isShaExistsInBranch: this.api.isShaExistsInBranch.bind(this.api),
      getDifferences: (source, destination) => this.api.getDifferences(source, destination),
      getFileId: path => Promise.resolve(this.api.getFileId(head, path)),
      filterFile: file => (0, _decapCmsLibUtil.filterByExtension)(file, extension)
    });
    return files;
  }
  async entriesByFiles(files) {
    const head = await this.api.defaultBranchCommitSha();
    const readFile = (path, id) => {
      return this.api.readFile(path, id, {
        head
      });
    };
    return (0, _decapCmsLibUtil.entriesByFiles)(files, readFile, this.api.readFileMetadata.bind(this.api), _API.API_NAME);
  }
  getEntry(path) {
    return this.api.readFile(path).then(data => ({
      file: {
        path,
        id: null
      },
      data: data
    }));
  }
  getMedia(mediaFolder = this.mediaFolder) {
    return this.api.listAllFiles(mediaFolder, 1, this.branch).then(files => files.map(({
      id,
      name,
      path
    }) => ({
      id,
      name,
      path,
      displayURL: {
        id,
        path
      }
    })));
  }
  getLargeMediaClient() {
    if (!this._largeMediaClientPromise) {
      this._largeMediaClientPromise = (async () => {
        const patterns = await this.api.readFile('.gitattributes').then(attributes => (0, _decapCmsLibUtil.getLargeMediaPatternsFromGitAttributesFile)(attributes)).catch(err => {
          if (err.status === 404) {
            console.log('This 404 was expected and handled appropriately.');
          } else {
            console.error(err);
          }
          return [];
        });
        return new _gitLfsClient.GitLfsClient(!!(this.largeMediaURL && patterns.length > 0), this.largeMediaURL, patterns, this.requestFunction);
      })();
    }
    return this._largeMediaClientPromise;
  }
  getMediaDisplayURL(displayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || (0, _semaphore.default)(MAX_CONCURRENT_DOWNLOADS);
    return (0, _decapCmsLibUtil.getMediaDisplayURL)(displayURL, this.api.readFile.bind(this.api), this._mediaDisplayURLSem);
  }
  async getMediaFile(path) {
    const name = (0, _decapCmsLibUtil.basename)(path);
    const blob = await (0, _decapCmsLibUtil.getMediaAsBlob)(path, null, this.api.readFile.bind(this.api));
    const fileObj = (0, _decapCmsLibUtil.blobToFileObj)(name, blob);
    const url = URL.createObjectURL(fileObj);
    const id = await (0, _decapCmsLibUtil.getBlobSHA)(fileObj);
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
    const client = await this.getLargeMediaClient();
    // persistEntry is a transactional operation
    return (0, _decapCmsLibUtil.runWithLock)(this.lock, async () => this.api.persistFiles(entry.dataFiles, client.enabled ? await (0, _decapCmsLibUtil.getLargeMediaFilteredMediaFiles)(client, entry.assets) : entry.assets, options), 'Failed to acquire persist entry lock');
  }
  async persistMedia(mediaFile, options) {
    const {
      fileObj,
      path
    } = mediaFile;
    const displayURL = fileObj ? URL.createObjectURL(fileObj) : '';
    const client = await this.getLargeMediaClient();
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    if (!client.enabled || !client.matchPath(fixedPath)) {
      return this._persistMedia(mediaFile, options);
    }
    const persistMediaArgument = await (0, _decapCmsLibUtil.getPointerFileForMediaFileObj)(client, fileObj, path);
    return _objectSpread(_objectSpread({}, await this._persistMedia(persistMediaArgument, options)), {}, {
      displayURL
    });
  }
  async _persistMedia(mediaFile, options) {
    const fileObj = mediaFile.fileObj;
    const [id] = await Promise.all([(0, _decapCmsLibUtil.getBlobSHA)(fileObj), this.api.persistFiles([], [mediaFile], options)]);
    const url = URL.createObjectURL(fileObj);
    return {
      displayURL: url,
      path: (0, _trimStart2.default)(mediaFile.path, '/k'),
      name: fileObj.name,
      size: fileObj.size,
      id,
      file: fileObj,
      url
    };
  }
  deleteFiles(paths, commitMessage) {
    return this.api.deleteFiles(paths, commitMessage);
  }
  traverseCursor(cursor, action) {
    return this.api.traverseCursor(cursor, action).then(async ({
      entries,
      cursor: newCursor
    }) => {
      var _cursor$meta;
      const extension = (_cursor$meta = cursor.meta) === null || _cursor$meta === void 0 ? void 0 : _cursor$meta.get('extension');
      if (extension) {
        entries = entries.filter(e => (0, _decapCmsLibUtil.filterByExtension)(e, extension));
        newCursor = newCursor.mergeMeta({
          extension
        });
      }
      const head = await this.api.defaultBranchCommitSha();
      const readFile = (path, id) => {
        return this.api.readFile(path, id, {
          head
        });
      };
      const entriesWithData = await (0, _decapCmsLibUtil.entriesByFiles)(entries, readFile, this.api.readFileMetadata.bind(this.api), _API.API_NAME);
      return {
        entries: entriesWithData,
        cursor: newCursor
      };
    });
  }
  async loadMediaFile(path, id, {
    branch
  }) {
    const readFile = async (path, id, {
      parseText
    }) => {
      const content = await this.api.readFile(path, id, {
        branch,
        parseText
      });
      return content;
    };
    const blob = await (0, _decapCmsLibUtil.getMediaAsBlob)(path, id, readFile);
    const name = (0, _decapCmsLibUtil.basename)(path);
    const fileObj = (0, _decapCmsLibUtil.blobToFileObj)(name, blob);
    return {
      id: path,
      displayURL: URL.createObjectURL(fileObj),
      path,
      name,
      size: fileObj.size,
      file: fileObj
    };
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
      const entryId = (0, _decapCmsLibUtil.generateContentKey)(collection, slug);
      const data = await this.api.retrieveUnpublishedEntryData(entryId);
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
  async unpublishedEntryDataFile(collection, slug, path, id) {
    const branch = this.getBranch(collection, slug);
    const data = await this.api.readFile(path, id, {
      branch
    });
    return data;
  }
  async unpublishedEntryMediaFile(collection, slug, path, id) {
    const branch = this.getBranch(collection, slug);
    const mediaFile = await this.loadMediaFile(path, id, {
      branch
    });
    return mediaFile;
  }
  async updateUnpublishedEntryStatus(collection, slug, newStatus) {
    // updateUnpublishedEntryStatus is a transactional operation
    return (0, _decapCmsLibUtil.runWithLock)(this.lock, () => this.api.updateUnpublishedEntryStatus(collection, slug, newStatus), 'Failed to acquire update entry status lock');
  }
  async deleteUnpublishedEntry(collection, slug) {
    // deleteUnpublishedEntry is a transactional operation
    return (0, _decapCmsLibUtil.runWithLock)(this.lock, () => this.api.deleteUnpublishedEntry(collection, slug), 'Failed to acquire delete entry lock');
  }
  async publishUnpublishedEntry(collection, slug) {
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
exports.default = BitbucketBackend;