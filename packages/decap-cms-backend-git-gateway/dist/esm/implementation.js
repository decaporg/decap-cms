"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _intersection2 = _interopRequireDefault(require("lodash/intersection"));
var _pick2 = _interopRequireDefault(require("lodash/pick"));
var _get2 = _interopRequireDefault(require("lodash/get"));
var _gotrueJs = _interopRequireDefault(require("gotrue-js"));
var _jwtDecode = _interopRequireDefault(require("jwt-decode"));
var _ini = _interopRequireDefault(require("ini"));
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _decapCmsBackendGithub = require("decap-cms-backend-github");
var _decapCmsBackendGitlab = require("decap-cms-backend-gitlab");
var _decapCmsBackendBitbucket = require("decap-cms-backend-bitbucket");
var _GitHubAPI = _interopRequireDefault(require("./GitHubAPI"));
var _GitLabAPI = _interopRequireDefault(require("./GitLabAPI"));
var _AuthenticationPage = _interopRequireDefault(require("./AuthenticationPage"));
var _netlifyLfsClient = require("./netlify-lfs-client");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const STATUS_PAGE = 'https://www.netlifystatus.com';
const GIT_GATEWAY_STATUS_ENDPOINT = `${STATUS_PAGE}/api/v2/components.json`;
const GIT_GATEWAY_OPERATIONAL_UNITS = ['Git Gateway'];
const localHosts = {
  localhost: true,
  '127.0.0.1': true,
  '0.0.0.0': true
};
const defaults = {
  identity: '/.netlify/identity',
  gateway: '/.netlify/git',
  largeMedia: '/.netlify/large-media'
};
function getEndpoint(endpoint, netlifySiteURL) {
  if (localHosts[document.location.host.split(':').shift()] && netlifySiteURL && endpoint.match(/^\/\.netlify\//)) {
    const parts = [];
    if (netlifySiteURL) {
      parts.push(netlifySiteURL);
      if (!netlifySiteURL.match(/\/$/)) {
        parts.push('/');
      }
    }
    parts.push(endpoint.replace(/^\//, ''));
    return parts.join('');
  }
  return endpoint;
}

// wait for identity widget to initialize
// force init on timeout
let initPromise = Promise.resolve();
if (window.netlifyIdentity) {
  let initialized = false;
  initPromise = Promise.race([new Promise(resolve => {
    var _window$netlifyIdenti;
    (_window$netlifyIdenti = window.netlifyIdentity) === null || _window$netlifyIdenti === void 0 ? void 0 : _window$netlifyIdenti.on('init', () => {
      initialized = true;
      resolve();
    });
  }), new Promise(resolve => setTimeout(resolve, 2500)).then(() => {
    if (!initialized) {
      var _window$netlifyIdenti2;
      console.log('Manually initializing identity widget');
      (_window$netlifyIdenti2 = window.netlifyIdentity) === null || _window$netlifyIdenti2 === void 0 ? void 0 : _window$netlifyIdenti2.init();
    }
  })]);
}
async function apiGet(path) {
  const apiRoot = 'https://api.netlify.com/api/v1/sites';
  const response = await fetch(`${apiRoot}/${path}`).then(res => res.json());
  return response;
}
class GitGateway {
  constructor(config, options = {}) {
    var _config$backend$branc;
    _defineProperty(this, "config", void 0);
    _defineProperty(this, "api", void 0);
    _defineProperty(this, "branch", void 0);
    _defineProperty(this, "squashMerges", void 0);
    _defineProperty(this, "cmsLabelPrefix", void 0);
    _defineProperty(this, "mediaFolder", void 0);
    _defineProperty(this, "transformImages", void 0);
    _defineProperty(this, "gatewayUrl", void 0);
    _defineProperty(this, "netlifyLargeMediaURL", void 0);
    _defineProperty(this, "backendType", void 0);
    _defineProperty(this, "apiUrl", void 0);
    _defineProperty(this, "authClient", void 0);
    _defineProperty(this, "backend", void 0);
    _defineProperty(this, "acceptRoles", void 0);
    _defineProperty(this, "tokenPromise", void 0);
    _defineProperty(this, "_largeMediaClientPromise", void 0);
    _defineProperty(this, "options", void 0);
    _defineProperty(this, "requestFunction", req => this.tokenPromise().then(token => _decapCmsLibUtil.unsentRequest.withHeaders({
      Authorization: `Bearer ${token}`
    }, req)).then(_decapCmsLibUtil.unsentRequest.performRequest));
    this.options = _objectSpread({
      proxied: true,
      API: null,
      initialWorkflowStatus: ''
    }, options);
    this.config = config;
    this.branch = ((_config$backend$branc = config.backend.branch) === null || _config$backend$branc === void 0 ? void 0 : _config$backend$branc.trim()) || 'master';
    this.squashMerges = config.backend.squash_merges || false;
    this.cmsLabelPrefix = config.backend.cms_label_prefix || '';
    this.mediaFolder = config.media_folder;
    const {
      use_large_media_transforms_in_media_library: transformImages = true
    } = config.backend;
    this.transformImages = transformImages;
    const netlifySiteURL = localStorage.getItem('netlifySiteURL');
    this.apiUrl = getEndpoint(config.backend.identity_url || defaults.identity, netlifySiteURL);
    this.gatewayUrl = getEndpoint(config.backend.gateway_url || defaults.gateway, netlifySiteURL);
    this.netlifyLargeMediaURL = getEndpoint(config.backend.large_media_url || defaults.largeMedia, netlifySiteURL);
    const backendTypeRegex = /\/(github|gitlab|bitbucket)\/?$/;
    const backendTypeMatches = this.gatewayUrl.match(backendTypeRegex);
    if (backendTypeMatches) {
      this.backendType = backendTypeMatches[1];
      this.gatewayUrl = this.gatewayUrl.replace(backendTypeRegex, '');
    } else {
      this.backendType = null;
    }
    this.backend = null;
    _AuthenticationPage.default.authClient = () => this.getAuthClient();
  }
  isGitBackend() {
    return true;
  }
  async status() {
    const api = await fetch(GIT_GATEWAY_STATUS_ENDPOINT).then(res => res.json()).then(res => {
      return res['components'].filter(statusComponent => GIT_GATEWAY_OPERATIONAL_UNITS.includes(statusComponent.name)).every(statusComponent => statusComponent.status === 'operational');
    }).catch(e => {
      console.warn('Failed getting Git Gateway status', e);
      return true;
    });
    let auth = false;
    // no need to check auth if api is down
    if (api) {
      var _this$tokenPromise;
      auth = (await ((_this$tokenPromise = this.tokenPromise) === null || _this$tokenPromise === void 0 ? void 0 : _this$tokenPromise.call(this).then(token => !!token).catch(e => {
        console.warn('Failed getting Identity token', e);
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
  async getAuthClient() {
    if (this.authClient) {
      return this.authClient;
    }
    await initPromise;
    if (window.netlifyIdentity) {
      this.authClient = {
        logout: () => {
          var _window$netlifyIdenti3;
          return (_window$netlifyIdenti3 = window.netlifyIdentity) === null || _window$netlifyIdenti3 === void 0 ? void 0 : _window$netlifyIdenti3.logout();
        },
        currentUser: () => {
          var _window$netlifyIdenti4;
          return (_window$netlifyIdenti4 = window.netlifyIdentity) === null || _window$netlifyIdenti4 === void 0 ? void 0 : _window$netlifyIdenti4.currentUser();
        },
        clearStore: () => {
          var _window$netlifyIdenti5;
          const store = (_window$netlifyIdenti5 = window.netlifyIdentity) === null || _window$netlifyIdenti5 === void 0 ? void 0 : _window$netlifyIdenti5.store;
          if (store) {
            store.user = null;
            store.modal.page = 'login';
            store.saving = false;
          }
        }
      };
    } else {
      const goTrue = new _gotrueJs.default({
        APIUrl: this.apiUrl
      });
      this.authClient = {
        logout: () => {
          const user = goTrue.currentUser();
          if (user) {
            return user.logout();
          }
        },
        currentUser: () => goTrue.currentUser(),
        login: goTrue.login.bind(goTrue),
        clearStore: () => undefined
      };
    }
    return this.authClient;
  }
  authenticate(credentials) {
    const user = credentials;
    this.tokenPromise = async () => {
      try {
        const func = user.jwt.bind(user);
        const token = await func();
        return token;
      } catch (error) {
        throw new _decapCmsLibUtil.AccessTokenError(`Failed getting access token: ${error.message}`);
      }
    };
    return this.tokenPromise().then(async token => {
      if (!this.backendType) {
        const {
          github_enabled: githubEnabled,
          gitlab_enabled: gitlabEnabled,
          bitbucket_enabled: bitbucketEnabled,
          roles
        } = await _decapCmsLibUtil.unsentRequest.fetchWithTimeout(`${this.gatewayUrl}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(async res => {
          const contentType = res.headers.get('Content-Type') || '';
          if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
            throw new _decapCmsLibUtil.APIError(`Your Git Gateway backend is not returning valid settings. Please make sure it is enabled.`, res.status, 'Git Gateway');
          }
          const body = await res.json();
          if (!res.ok) {
            throw new _decapCmsLibUtil.APIError(`Git Gateway Error: ${body.message ? body.message : body}`, res.status, 'Git Gateway');
          }
          return body;
        });
        this.acceptRoles = roles;
        if (githubEnabled) {
          this.backendType = 'github';
        } else if (gitlabEnabled) {
          this.backendType = 'gitlab';
        } else if (bitbucketEnabled) {
          this.backendType = 'bitbucket';
        }
      }
      if (this.acceptRoles && this.acceptRoles.length > 0) {
        const userRoles = (0, _get2.default)((0, _jwtDecode.default)(token), 'app_metadata.roles', []);
        const validRole = (0, _intersection2.default)(userRoles, this.acceptRoles).length > 0;
        if (!validRole) {
          throw new Error("You don't have sufficient permissions to access Decap CMS");
        }
      }
      const userData = {
        name: user.user_metadata.full_name || user.email.split('@').shift(),
        email: user.email,
        avatar_url: user.user_metadata.avatar_url,
        metadata: user.user_metadata
      };
      const apiConfig = {
        apiRoot: `${this.gatewayUrl}/${this.backendType}`,
        branch: this.branch,
        tokenPromise: this.tokenPromise,
        commitAuthor: (0, _pick2.default)(userData, ['name', 'email']),
        isLargeMedia: filename => this.isLargeMediaFile(filename),
        squashMerges: this.squashMerges,
        cmsLabelPrefix: this.cmsLabelPrefix,
        initialWorkflowStatus: this.options.initialWorkflowStatus
      };
      if (this.backendType === 'github') {
        this.api = new _GitHubAPI.default(apiConfig);
        this.backend = new _decapCmsBackendGithub.GitHubBackend(this.config, _objectSpread(_objectSpread({}, this.options), {}, {
          API: this.api
        }));
      } else if (this.backendType === 'gitlab') {
        this.api = new _GitLabAPI.default(apiConfig);
        this.backend = new _decapCmsBackendGitlab.GitLabBackend(this.config, _objectSpread(_objectSpread({}, this.options), {}, {
          API: this.api
        }));
      } else if (this.backendType === 'bitbucket') {
        this.api = new _decapCmsBackendBitbucket.API(_objectSpread(_objectSpread({}, apiConfig), {}, {
          requestFunction: this.requestFunction,
          hasWriteAccess: async () => true
        }));
        this.backend = new _decapCmsBackendBitbucket.BitbucketBackend(this.config, _objectSpread(_objectSpread({}, this.options), {}, {
          API: this.api
        }));
      }
      if (!(await this.api.hasWriteAccess())) {
        throw new Error("You don't have sufficient permissions to access Decap CMS");
      }
      return {
        name: userData.name,
        login: userData.email
      };
    });
  }
  async restoreUser() {
    const client = await this.getAuthClient();
    const user = client.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user);
  }
  authComponent() {
    return _AuthenticationPage.default;
  }
  async logout() {
    const client = await this.getAuthClient();
    try {
      client.logout();
    } catch (e) {
      // due to a bug in the identity widget (gotrue-js actually) the store is not reset if logout fails
      // TODO: remove after https://github.com/netlify/gotrue-js/pull/83 is merged
      client.clearStore();
    }
  }
  getToken() {
    return this.tokenPromise();
  }
  async entriesByFolder(folder, extension, depth) {
    return this.backend.entriesByFolder(folder, extension, depth);
  }
  allEntriesByFolder(folder, extension, depth, pathRegex) {
    return this.backend.allEntriesByFolder(folder, extension, depth, pathRegex);
  }
  entriesByFiles(files) {
    return this.backend.entriesByFiles(files);
  }
  getEntry(path) {
    return this.backend.getEntry(path);
  }
  async unpublishedEntryDataFile(collection, slug, path, id) {
    return this.backend.unpublishedEntryDataFile(collection, slug, path, id);
  }
  async isLargeMediaFile(path) {
    const client = await this.getLargeMediaClient();
    return client.enabled && client.matchPath(path);
  }
  async unpublishedEntryMediaFile(collection, slug, path, id) {
    const isLargeMedia = await this.isLargeMediaFile(path);
    if (isLargeMedia) {
      const branch = this.backend.getBranch(collection, slug);
      const {
        url,
        blob
      } = await this.getLargeMediaDisplayURL({
        path,
        id
      }, branch);
      return {
        id,
        name: (0, _decapCmsLibUtil.basename)(path),
        path,
        url,
        displayURL: url,
        file: new File([blob], (0, _decapCmsLibUtil.basename)(path)),
        size: blob.size
      };
    } else {
      return this.backend.unpublishedEntryMediaFile(collection, slug, path, id);
    }
  }
  getMedia(mediaFolder = this.mediaFolder) {
    return this.backend.getMedia(mediaFolder);
  }

  // this method memoizes this._getLargeMediaClient so that there can
  // only be one client at a time
  getLargeMediaClient() {
    if (this._largeMediaClientPromise) {
      return this._largeMediaClientPromise;
    }
    this._largeMediaClientPromise = this._getLargeMediaClient();
    return this._largeMediaClientPromise;
  }
  _getLargeMediaClient() {
    const netlifyLargeMediaEnabledPromise = this.api.readFile('.lfsconfig').then(config => _ini.default.decode(config)).then(({
      lfs: {
        url
      }
    }) => new URL(url)).then(lfsURL => ({
      enabled: lfsURL.hostname.endsWith('netlify.com') || lfsURL.hostname.endsWith('netlify.app')
    })).catch(err => ({
      enabled: false,
      err
    }));
    const lfsPatternsPromise = this.api.readFile('.gitattributes').then(attributes => (0, _decapCmsLibUtil.getLargeMediaPatternsFromGitAttributesFile)(attributes)).then(patterns => ({
      err: null,
      patterns
    })).catch(err => {
      if (err.message.includes('404')) {
        console.log('This 404 was expected and handled appropriately.');
        return {
          err: null,
          patterns: []
        };
      } else {
        return {
          err,
          patterns: []
        };
      }
    });
    return Promise.all([netlifyLargeMediaEnabledPromise, lfsPatternsPromise]).then(([{
      enabled: maybeEnabled
    }, {
      patterns,
      err: patternsErr
    }]) => {
      const enabled = maybeEnabled && !patternsErr;

      // We expect LFS patterns to exist when the .lfsconfig states
      // that we're using Netlify Large Media
      if (maybeEnabled && patternsErr) {
        console.error(patternsErr);
      }
      return (0, _netlifyLfsClient.getClient)({
        enabled,
        rootURL: this.netlifyLargeMediaURL,
        makeAuthorizedRequest: this.requestFunction,
        patterns,
        transformImages: this.transformImages ? {
          nf_resize: 'fit',
          w: 560,
          h: 320
        } : false
      });
    });
  }
  async getLargeMediaDisplayURL({
    path,
    id
  }, branch = this.branch) {
    const readFile = (path, id, {
      parseText
    }) => this.api.readFile(path, id, {
      branch,
      parseText
    });
    const items = await (0, _decapCmsLibUtil.entriesByFiles)([{
      path,
      id
    }], readFile, this.api.readFileMetadata.bind(this.api), 'Git-Gateway');
    const entry = items[0];
    const pointerFile = (0, _decapCmsLibUtil.parsePointerFile)(entry.data);
    if (!pointerFile.sha) {
      console.warn(`Failed parsing pointer file ${path}`);
      return {
        url: path,
        blob: new Blob()
      };
    }
    const client = await this.getLargeMediaClient();
    const {
      url,
      blob
    } = await client.getDownloadURL(pointerFile);
    return {
      url,
      blob
    };
  }
  async getMediaDisplayURL(displayURL) {
    const {
      path,
      id
    } = displayURL;
    const isLargeMedia = await this.isLargeMediaFile(path);
    if (isLargeMedia) {
      const {
        url
      } = await this.getLargeMediaDisplayURL({
        path,
        id
      });
      return url;
    }
    if (typeof displayURL === 'string') {
      return displayURL;
    }
    const url = await this.backend.getMediaDisplayURL(displayURL);
    return url;
  }
  async getMediaFile(path) {
    const isLargeMedia = await this.isLargeMediaFile(path);
    if (isLargeMedia) {
      const {
        url,
        blob
      } = await this.getLargeMediaDisplayURL({
        path,
        id: null
      });
      return {
        id: url,
        name: (0, _decapCmsLibUtil.basename)(path),
        path,
        url,
        displayURL: url,
        file: new File([blob], (0, _decapCmsLibUtil.basename)(path)),
        size: blob.size
      };
    }
    return this.backend.getMediaFile(path);
  }
  async persistEntry(entry, options) {
    const client = await this.getLargeMediaClient();
    if (client.enabled) {
      const assets = await (0, _decapCmsLibUtil.getLargeMediaFilteredMediaFiles)(client, entry.assets);
      return this.backend.persistEntry(_objectSpread(_objectSpread({}, entry), {}, {
        assets
      }), options);
    } else {
      return this.backend.persistEntry(entry, options);
    }
  }
  async persistMedia(mediaFile, options) {
    const {
      fileObj,
      path
    } = mediaFile;
    const displayURL = fileObj ? URL.createObjectURL(fileObj) : '';
    const client = await this.getLargeMediaClient();
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    const isLargeMedia = await this.isLargeMediaFile(fixedPath);
    if (isLargeMedia) {
      const persistMediaArgument = await (0, _decapCmsLibUtil.getPointerFileForMediaFileObj)(client, fileObj, path);
      return _objectSpread(_objectSpread({}, await this.backend.persistMedia(persistMediaArgument, options)), {}, {
        displayURL
      });
    }
    return await this.backend.persistMedia(mediaFile, options);
  }
  deleteFiles(paths, commitMessage) {
    return this.backend.deleteFiles(paths, commitMessage);
  }
  async getDeployPreview(collection, slug) {
    let preview = await this.backend.getDeployPreview(collection, slug);
    if (!preview) {
      try {
        // if the commit doesn't have a status, try to use Netlify API directly
        // this is useful when builds are queue up in Netlify and don't have a commit status yet
        // and only works with public logs at the moment
        // TODO: get Netlify API Token and use it to access private logs
        const siteId = new URL(localStorage.getItem('netlifySiteURL') || '').hostname;
        const site = await apiGet(siteId);
        const deploys = await apiGet(`${site.id}/deploys?per_page=100`);
        if (deploys.length > 0) {
          const ref = await this.api.getUnpublishedEntrySha(collection, slug);
          const deploy = deploys.find(d => d.commit_ref === ref);
          if (deploy) {
            preview = {
              status: deploy.state === 'ready' ? _decapCmsLibUtil.PreviewState.Success : _decapCmsLibUtil.PreviewState.Other,
              url: deploy.deploy_url
            };
          }
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    return preview;
  }
  unpublishedEntries() {
    return this.backend.unpublishedEntries();
  }
  unpublishedEntry({
    id,
    collection,
    slug
  }) {
    return this.backend.unpublishedEntry({
      id,
      collection,
      slug
    });
  }
  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.backend.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }
  deleteUnpublishedEntry(collection, slug) {
    return this.backend.deleteUnpublishedEntry(collection, slug);
  }
  publishUnpublishedEntry(collection, slug) {
    return this.backend.publishUnpublishedEntry(collection, slug);
  }
  traverseCursor(cursor, action) {
    return this.backend.traverseCursor(cursor, action);
  }
}
exports.default = GitGateway;