"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PullRequestState = exports.MOCK_PULL_REQUEST = exports.API_NAME = void 0;
var _trim2 = _interopRequireDefault(require("lodash/trim"));
var _trimStart2 = _interopRequireDefault(require("lodash/trimStart"));
var _result2 = _interopRequireDefault(require("lodash/result"));
var _partial2 = _interopRequireDefault(require("lodash/partial"));
var _last2 = _interopRequireDefault(require("lodash/last"));
var _initial2 = _interopRequireDefault(require("lodash/initial"));
var _jsBase = require("js-base64");
var _semaphore = _interopRequireDefault(require("semaphore"));
var _commonTags = require("common-tags");
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _path = require("path");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const API_NAME = 'GitHub';
exports.API_NAME = API_NAME;
const MOCK_PULL_REQUEST = -1;
exports.MOCK_PULL_REQUEST = MOCK_PULL_REQUEST;
var GitHubCommitStatusState = /*#__PURE__*/function (GitHubCommitStatusState) {
  GitHubCommitStatusState["Error"] = "error";
  GitHubCommitStatusState["Failure"] = "failure";
  GitHubCommitStatusState["Pending"] = "pending";
  GitHubCommitStatusState["Success"] = "success";
  return GitHubCommitStatusState;
}(GitHubCommitStatusState || {});
let PullRequestState = /*#__PURE__*/function (PullRequestState) {
  PullRequestState["Open"] = "open";
  PullRequestState["Closed"] = "closed";
  PullRequestState["All"] = "all";
  return PullRequestState;
}({});
exports.PullRequestState = PullRequestState;
function withCmsLabel(pr, cmsLabelPrefix) {
  return pr.labels.some(l => (0, _decapCmsLibUtil.isCMSLabel)(l.name, cmsLabelPrefix));
}
function withoutCmsLabel(pr, cmsLabelPrefix) {
  return pr.labels.every(l => !(0, _decapCmsLibUtil.isCMSLabel)(l.name, cmsLabelPrefix));
}
function getTreeFiles(files) {
  const treeFiles = files.reduce((arr, file) => {
    if (file.status === 'removed') {
      // delete the file
      arr.push({
        sha: null,
        path: file.filename
      });
    } else if (file.status === 'renamed') {
      // delete the previous file
      arr.push({
        sha: null,
        path: file.previous_filename
      });
      // add the renamed file
      arr.push({
        sha: file.sha,
        path: file.filename
      });
    } else {
      // add the  file
      arr.push({
        sha: file.sha,
        path: file.filename
      });
    }
    return arr;
  }, []);
  return treeFiles;
}
let migrationNotified = false;
class API {
  constructor(config) {
    _defineProperty(this, "apiRoot", void 0);
    _defineProperty(this, "token", void 0);
    _defineProperty(this, "branch", void 0);
    _defineProperty(this, "useOpenAuthoring", void 0);
    _defineProperty(this, "repo", void 0);
    _defineProperty(this, "originRepo", void 0);
    _defineProperty(this, "repoOwner", void 0);
    _defineProperty(this, "repoName", void 0);
    _defineProperty(this, "originRepoOwner", void 0);
    _defineProperty(this, "originRepoName", void 0);
    _defineProperty(this, "repoURL", void 0);
    _defineProperty(this, "originRepoURL", void 0);
    _defineProperty(this, "mergeMethod", void 0);
    _defineProperty(this, "initialWorkflowStatus", void 0);
    _defineProperty(this, "cmsLabelPrefix", void 0);
    _defineProperty(this, "_userPromise", void 0);
    _defineProperty(this, "_metadataSemaphore", void 0);
    _defineProperty(this, "commitAuthor", void 0);
    _defineProperty(this, "filterOpenAuthoringBranches", async branch => {
      try {
        const pullRequest = await this.getBranchPullRequest(branch);
        const {
          state: currentState,
          merged_at: mergedAt
        } = pullRequest;
        if (pullRequest.number !== MOCK_PULL_REQUEST && currentState === PullRequestState.Closed && mergedAt) {
          // pr was merged, delete branch
          await this.deleteBranch(branch);
          return {
            branch,
            filter: false
          };
        } else {
          return {
            branch,
            filter: true
          };
        }
      } catch (e) {
        return {
          branch,
          filter: false
        };
      }
    });
    this.apiRoot = config.apiRoot || 'https://api.github.com';
    this.token = config.token || '';
    this.branch = config.branch || 'master';
    this.useOpenAuthoring = config.useOpenAuthoring;
    this.repo = config.repo || '';
    this.originRepo = config.originRepo || this.repo;
    this.repoURL = `/repos/${this.repo}`;
    // when not in 'useOpenAuthoring' mode originRepoURL === repoURL
    this.originRepoURL = `/repos/${this.originRepo}`;
    const [repoParts, originRepoParts] = [this.repo.split('/'), this.originRepo.split('/')];
    this.repoOwner = repoParts[0];
    this.repoName = repoParts[1];
    this.originRepoOwner = originRepoParts[0];
    this.originRepoName = originRepoParts[1];
    this.mergeMethod = config.squashMerges ? 'squash' : 'merge';
    this.cmsLabelPrefix = config.cmsLabelPrefix;
    this.initialWorkflowStatus = config.initialWorkflowStatus;
  }
  user() {
    if (!this._userPromise) {
      this._userPromise = this.getUser();
    }
    return this._userPromise;
  }
  getUser() {
    return this.request('/user');
  }
  async hasWriteAccess() {
    try {
      const result = await this.request(this.repoURL);
      // update config repoOwner to avoid case sensitivity issues with GitHub
      this.repoOwner = result.owner.login;
      return result.permissions.push;
    } catch (error) {
      console.error('Problem fetching repo data from GitHub');
      throw error;
    }
  }
  reset() {
    // no op
  }
  requestHeaders(headers = {}) {
    const baseHeader = _objectSpread({
      'Content-Type': 'application/json; charset=utf-8'
    }, headers);
    if (this.token) {
      baseHeader.Authorization = `token ${this.token}`;
      return Promise.resolve(baseHeader);
    }
    return Promise.resolve(baseHeader);
  }
  parseJsonResponse(response) {
    return response.json().then(json => {
      if (!response.ok) {
        return Promise.reject(json);
      }
      return json;
    });
  }
  urlFor(path, options) {
    const params = [];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${key}=${encodeURIComponent(options.params[key])}`);
      }
    }
    if (params.length) {
      path += `?${params.join('&')}`;
    }
    return this.apiRoot + path;
  }
  parseResponse(response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.match(/json/)) {
      return this.parseJsonResponse(response);
    }
    const textPromise = response.text().then(text => {
      if (!response.ok) {
        return Promise.reject(text);
      }
      return text;
    });
    return textPromise;
  }
  handleRequestError(error, responseStatus) {
    throw new _decapCmsLibUtil.APIError(error.message, responseStatus, API_NAME);
  }
  buildRequest(req) {
    return req;
  }
  async request(path, options = {}, parser = response => this.parseResponse(response)) {
    options = _objectSpread({
      cache: 'no-cache'
    }, options);
    const headers = await this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    let responseStatus = 500;
    try {
      const req = _decapCmsLibUtil.unsentRequest.fromFetchArguments(url, _objectSpread(_objectSpread({}, options), {}, {
        headers
      }));
      const response = await (0, _decapCmsLibUtil.requestWithBackoff)(this, req);
      responseStatus = response.status;
      const parsedResponse = await parser(response);
      return parsedResponse;
    } catch (error) {
      return this.handleRequestError(error, responseStatus);
    }
  }
  nextUrlProcessor() {
    return url => url;
  }
  async requestAllPages(url, options = {}) {
    options = _objectSpread({
      cache: 'no-cache'
    }, options);
    const headers = await this.requestHeaders(options.headers || {});
    const processedURL = this.urlFor(url, options);
    const allResponses = await (0, _decapCmsLibUtil.getAllResponses)(processedURL, _objectSpread(_objectSpread({}, options), {}, {
      headers
    }), 'next', this.nextUrlProcessor());
    const pages = await Promise.all(allResponses.map(res => this.parseResponse(res)));
    return [].concat(...pages);
  }
  generateContentKey(collectionName, slug) {
    const contentKey = (0, _decapCmsLibUtil.generateContentKey)(collectionName, slug);
    if (!this.useOpenAuthoring) {
      return contentKey;
    }
    return `${this.repo}/${contentKey}`;
  }
  parseContentKey(contentKey) {
    if (!this.useOpenAuthoring) {
      return (0, _decapCmsLibUtil.parseContentKey)(contentKey);
    }
    return (0, _decapCmsLibUtil.parseContentKey)(contentKey.slice(this.repo.length + 1));
  }
  checkMetadataRef() {
    return this.request(`${this.repoURL}/git/refs/meta/_decap_cms`).then(response => response.object).catch(() => {
      // Meta ref doesn't exist
      const readme = {
        raw: '# Decap CMS\n\nThis tree is used by the Decap CMS to store metadata information for specific files and branches.'
      };
      return this.uploadBlob(readme).then(item => this.request(`${this.repoURL}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({
          tree: [{
            path: 'README.md',
            mode: '100644',
            type: 'blob',
            sha: item.sha
          }]
        })
      })).then(tree => this.commit('First Commit', tree)).then(response => this.createRef('meta', '_decap_cms', response.sha)).then(response => response.object);
    });
  }
  async storeMetadata(key, data) {
    // semaphore ensures metadata updates are always ordered, even if
    // calls to storeMetadata are not. concurrent metadata updates
    // will result in the metadata branch being unable to update.
    if (!this._metadataSemaphore) {
      this._metadataSemaphore = (0, _semaphore.default)(1);
    }
    return new Promise((resolve, reject) => {
      var _this$_metadataSemaph;
      return (_this$_metadataSemaph = this._metadataSemaphore) === null || _this$_metadataSemaph === void 0 ? void 0 : _this$_metadataSemaph.take(async () => {
        try {
          var _this$_metadataSemaph2;
          const branchData = await this.checkMetadataRef();
          const file = {
            path: `${key}.json`,
            raw: JSON.stringify(data)
          };
          await this.uploadBlob(file);
          const changeTree = await this.updateTree(branchData.sha, [file]);
          const {
            sha
          } = await this.commit(`Updating “${key}” metadata`, changeTree);
          await this.patchRef('meta', '_decap_cms', sha);
          await _decapCmsLibUtil.localForage.setItem(`gh.meta.${key}`, {
            expires: Date.now() + 300000,
            // In 5 minutes
            data
          });
          (_this$_metadataSemaph2 = this._metadataSemaphore) === null || _this$_metadataSemaph2 === void 0 ? void 0 : _this$_metadataSemaph2.leave();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }
  deleteMetadata(key) {
    if (!this._metadataSemaphore) {
      this._metadataSemaphore = (0, _semaphore.default)(1);
    }
    return new Promise(resolve => {
      var _this$_metadataSemaph3;
      return (_this$_metadataSemaph3 = this._metadataSemaphore) === null || _this$_metadataSemaph3 === void 0 ? void 0 : _this$_metadataSemaph3.take(async () => {
        try {
          var _this$_metadataSemaph4;
          const branchData = await this.checkMetadataRef();
          const file = {
            path: `${key}.json`,
            sha: null
          };
          const changeTree = await this.updateTree(branchData.sha, [file]);
          const {
            sha
          } = await this.commit(`Deleting “${key}” metadata`, changeTree);
          await this.patchRef('meta', '_decap_cms', sha);
          (_this$_metadataSemaph4 = this._metadataSemaphore) === null || _this$_metadataSemaph4 === void 0 ? void 0 : _this$_metadataSemaph4.leave();
          resolve();
        } catch (err) {
          var _this$_metadataSemaph5;
          (_this$_metadataSemaph5 = this._metadataSemaphore) === null || _this$_metadataSemaph5 === void 0 ? void 0 : _this$_metadataSemaph5.leave();
          resolve();
        }
      });
    });
  }
  async retrieveMetadataOld(key) {
    console.log('%c Checking for MetaData files', 'line-height: 30px;text-align: center;font-weight: bold');
    const metadataRequestOptions = {
      params: {
        ref: 'refs/meta/_decap_cms'
      },
      headers: {
        Accept: 'application/vnd.github.v3.raw'
      }
    };
    function errorHandler(err) {
      if (err.message === 'Not Found') {
        console.log('%c %s does not have metadata', 'line-height: 30px;text-align: center;font-weight: bold', key);
      }
      throw err;
    }
    if (!this.useOpenAuthoring) {
      const result = await this.request(`${this.repoURL}/contents/${key}.json`, metadataRequestOptions).then(response => JSON.parse(response)).catch(errorHandler);
      return result;
    }
    const [user, repo] = key.split('/');
    const result = this.request(`/repos/${user}/${repo}/contents/${key}.json`, metadataRequestOptions).then(response => JSON.parse(response)).catch(errorHandler);
    return result;
  }
  async getPullRequests(head, state, predicate) {
    const pullRequests = await this.requestAllPages(`${this.originRepoURL}/pulls`, {
      params: _objectSpread(_objectSpread({}, head ? {
        head: await this.getHeadReference(head)
      } : {}), {}, {
        base: this.branch,
        state,
        per_page: 100
      })
    });
    return pullRequests.filter(pr => pr.head.ref.startsWith(`${_decapCmsLibUtil.CMS_BRANCH_PREFIX}/`) && predicate(pr));
  }
  async getOpenAuthoringPullRequest(branch, pullRequests) {
    // we can't use labels when using open authoring
    // since the contributor doesn't have access to set labels
    // a branch without a pr (or a closed pr) means a 'draft' entry
    // a branch with an opened pr means a 'pending_review' entry
    const data = await this.getBranch(branch).catch(() => {
      throw new _decapCmsLibUtil.EditorialWorkflowError('content is not under editorial workflow', true);
    });
    // since we get all (open and closed) pull requests by branch name, make sure to filter by head sha
    const pullRequest = pullRequests.filter(pr => pr.head.sha === data.commit.sha)[0];
    // if no pull request is found for the branch we return a mocked one
    if (!pullRequest) {
      try {
        return {
          head: {
            sha: data.commit.sha
          },
          number: MOCK_PULL_REQUEST,
          labels: [{
            name: (0, _decapCmsLibUtil.statusToLabel)(this.initialWorkflowStatus, this.cmsLabelPrefix)
          }],
          state: PullRequestState.Open
        };
      } catch (e) {
        throw new _decapCmsLibUtil.EditorialWorkflowError('content is not under editorial workflow', true);
      }
    } else {
      pullRequest.labels = pullRequest.labels.filter(l => !(0, _decapCmsLibUtil.isCMSLabel)(l.name, this.cmsLabelPrefix));
      const cmsLabel = pullRequest.state === PullRequestState.Closed ? {
        name: (0, _decapCmsLibUtil.statusToLabel)(this.initialWorkflowStatus, this.cmsLabelPrefix)
      } : {
        name: (0, _decapCmsLibUtil.statusToLabel)('pending_review', this.cmsLabelPrefix)
      };
      pullRequest.labels.push(cmsLabel);
      return pullRequest;
    }
  }
  async getBranchPullRequest(branch) {
    if (this.useOpenAuthoring) {
      const pullRequests = await this.getPullRequests(branch, PullRequestState.All, () => true);
      return this.getOpenAuthoringPullRequest(branch, pullRequests);
    } else {
      const pullRequests = await this.getPullRequests(branch, PullRequestState.Open, pr => withCmsLabel(pr, this.cmsLabelPrefix));
      if (pullRequests.length <= 0) {
        throw new _decapCmsLibUtil.EditorialWorkflowError('content is not under editorial workflow', true);
      }
      return pullRequests[0];
    }
  }
  async getPullRequestCommits(number) {
    if (number === MOCK_PULL_REQUEST) {
      return [];
    }
    try {
      const commits = await this.request(`${this.originRepoURL}/pulls/${number}/commits`);
      return commits;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  async getPullRequestAuthor(pullRequest) {
    var _pullRequest$user;
    if (!((_pullRequest$user = pullRequest.user) !== null && _pullRequest$user !== void 0 && _pullRequest$user.login)) {
      return;
    }
    try {
      const user = await this.request(`/users/${pullRequest.user.login}`);
      return user.name || user.login;
    } catch {
      return;
    }
  }
  async retrieveUnpublishedEntryData(contentKey) {
    const {
      collection,
      slug
    } = this.parseContentKey(contentKey);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const [{
      files
    }, pullRequestAuthor] = await Promise.all([this.getDifferences(this.branch, pullRequest.head.sha), this.getPullRequestAuthor(pullRequest)]);
    const diffs = await Promise.all(files.map(file => this.diffFromFile(file)));
    const label = pullRequest.labels.find(l => (0, _decapCmsLibUtil.isCMSLabel)(l.name, this.cmsLabelPrefix));
    const status = (0, _decapCmsLibUtil.labelToStatus)(label.name, this.cmsLabelPrefix);
    const updatedAt = pullRequest.updated_at;
    return {
      collection,
      slug,
      status,
      diffs: diffs.map(d => ({
        path: d.path,
        newFile: d.newFile,
        id: d.sha
      })),
      updatedAt,
      pullRequestAuthor
    };
  }
  async readFile(path, sha, {
    branch = this.branch,
    repoURL = this.repoURL,
    parseText = true
  } = {}) {
    if (!sha) {
      sha = await this.getFileSha(path, {
        repoURL,
        branch
      });
    }
    const content = await this.fetchBlobContent({
      sha: sha,
      repoURL,
      parseText
    });
    return content;
  }
  async readFileMetadata(path, sha) {
    const fetchFileMetadata = async () => {
      try {
        const result = await this.request(`${this.originRepoURL}/commits`, {
          params: {
            path,
            sha: this.branch
          }
        });
        const {
          commit
        } = result[0];
        return {
          author: commit.author.name || commit.author.email,
          updatedOn: commit.author.date
        };
      } catch (e) {
        return {
          author: '',
          updatedOn: ''
        };
      }
    };
    const fileMetadata = await (0, _decapCmsLibUtil.readFileMetadata)(sha, fetchFileMetadata, _decapCmsLibUtil.localForage);
    return fileMetadata;
  }
  async fetchBlobContent({
    sha,
    repoURL,
    parseText
  }) {
    const result = await this.request(`${repoURL}/git/blobs/${sha}`, {
      cache: 'force-cache'
    });
    if (parseText) {
      // treat content as a utf-8 string
      const content = _jsBase.Base64.decode(result.content);
      return content;
    } else {
      // treat content as binary and convert to blob
      const content = _jsBase.Base64.atob(result.content);
      const byteArray = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) {
        byteArray[i] = content.charCodeAt(i);
      }
      const blob = new Blob([byteArray]);
      return blob;
    }
  }
  async listFiles(path, {
    repoURL = this.repoURL,
    branch = this.branch,
    depth = 1
  } = {}) {
    const folder = (0, _trim2.default)(path, '/');
    try {
      const result = await this.request(`${repoURL}/git/trees/${branch}:${folder}`, {
        // GitHub API supports recursive=1 for getting the entire recursive tree
        // or omitting it to get the non-recursive tree
        params: depth > 1 ? {
          recursive: 1
        } : {}
      });
      return result.tree
      // filter only files and up to the required depth
      .filter(file => file.type === 'blob' && file.path.split('/').length <= depth).map(file => ({
        type: file.type,
        id: file.sha,
        name: (0, _decapCmsLibUtil.basename)(file.path),
        path: `${folder}/${file.path}`,
        size: file.size
      }));
    } catch (err) {
      if (err && err.status === 404) {
        console.log('This 404 was expected and handled appropriately.');
        return [];
      } else {
        throw err;
      }
    }
  }
  async migrateToVersion1(pullRequest, metadata) {
    // hard code key/branch generation logic to ignore future changes
    const oldContentKey = pullRequest.head.ref.slice(`cms/`.length);
    const newContentKey = `${metadata.collection}/${oldContentKey}`;
    const newBranchName = `cms/${newContentKey}`;

    // retrieve or create new branch and pull request in new format
    const branch = await this.getBranch(newBranchName).catch(() => undefined);
    if (!branch) {
      await this.createBranch(newBranchName, pullRequest.head.sha);
    }
    const pr = (await this.getPullRequests(newBranchName, PullRequestState.All, () => true))[0] || (await this.createPR(pullRequest.title, newBranchName));

    // store new metadata
    const newMetadata = _objectSpread(_objectSpread({}, metadata), {}, {
      pr: {
        number: pr.number,
        head: pr.head.sha
      },
      branch: newBranchName,
      version: '1'
    });
    await this.storeMetadata(newContentKey, newMetadata);

    // remove old data
    await this.closePR(pullRequest.number);
    await this.deleteBranch(pullRequest.head.ref);
    await this.deleteMetadata(oldContentKey);
    return {
      metadata: newMetadata,
      pullRequest: pr
    };
  }
  async migrateToPullRequestLabels(pullRequest, metadata) {
    await this.setPullRequestStatus(pullRequest, metadata.status);
    const contentKey = pullRequest.head.ref.slice(`cms/`.length);
    await this.deleteMetadata(contentKey);
  }
  async migratePullRequest(pullRequest, countMessage) {
    const {
      number
    } = pullRequest;
    console.log(`Migrating Pull Request '${number}' (${countMessage})`);
    const contentKey = (0, _decapCmsLibUtil.contentKeyFromBranch)(pullRequest.head.ref);
    let metadata = await this.retrieveMetadataOld(contentKey).catch(() => undefined);
    if (!metadata) {
      console.log(`Skipped migrating Pull Request '${number}' (${countMessage})`);
      return;
    }
    let newNumber = number;
    if (!metadata.version) {
      console.log(`Migrating Pull Request '${number}' to version 1`);
      // migrate branch from cms/slug to cms/collection/slug
      try {
        ({
          metadata,
          pullRequest
        } = await this.migrateToVersion1(pullRequest, metadata));
      } catch (e) {
        console.log(`Failed to migrate Pull Request '${number}' to version 1. See error below.`);
        console.error(e);
        return;
      }
      newNumber = pullRequest.number;
      console.log(`Done migrating Pull Request '${number}' to version 1. New pull request '${newNumber}' created.`);
    }
    if (metadata.version === '1') {
      console.log(`Migrating Pull Request '${newNumber}' to labels`);
      // migrate branch from using orphan ref to store metadata to pull requests label
      await this.migrateToPullRequestLabels(pullRequest, metadata);
      console.log(`Done migrating Pull Request '${newNumber}' to labels`);
    }
    console.log(`Done migrating Pull Request '${number === newNumber ? newNumber : `${number} => ${newNumber}`}'`);
  }
  async getOpenAuthoringBranches() {
    const cmsBranches = await this.requestAllPages(`${this.repoURL}/git/refs/heads/cms/${this.repo}`).catch(() => []);
    return cmsBranches;
  }
  async listUnpublishedBranches() {
    console.log('%c Checking for Unpublished entries', 'line-height: 30px;text-align: center;font-weight: bold');
    let branches;
    if (this.useOpenAuthoring) {
      // open authoring branches can exist without a pr
      const cmsBranches = await this.getOpenAuthoringBranches();
      branches = cmsBranches.map(b => b.ref.slice('refs/heads/'.length));
      // filter irrelevant branches
      const branchesWithFilter = await Promise.all(branches.map(b => this.filterOpenAuthoringBranches(b)));
      branches = branchesWithFilter.filter(b => b.filter).map(b => b.branch);
    } else {
      // backwards compatibility code, get relevant pull requests and migrate them
      const pullRequests = await this.getPullRequests(undefined, PullRequestState.Open, pr => !pr.head.repo.fork && withoutCmsLabel(pr, this.cmsLabelPrefix));
      let prCount = 0;
      for (const pr of pullRequests) {
        if (!migrationNotified) {
          migrationNotified = true;
          alert((0, _commonTags.oneLine)`
            Decap CMS is adding labels to ${pullRequests.length} of your Editorial Workflow
            entries. The "Workflow" tab will be unavailable during this migration. You may use other
            areas of the CMS during this time. Note that closing the CMS will pause the migration.
          `);
        }
        prCount = prCount + 1;
        await this.migratePullRequest(pr, `${prCount} of ${pullRequests.length}`);
      }
      const cmsPullRequests = await this.getPullRequests(undefined, PullRequestState.Open, pr => withCmsLabel(pr, this.cmsLabelPrefix));
      branches = cmsPullRequests.map(pr => pr.head.ref);
    }
    return branches;
  }

  /**
   * Retrieve statuses for a given SHA. Unrelated to the editorial workflow
   * concept of entry "status". Useful for things like deploy preview links.
   */
  async getStatuses(collectionName, slug) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const sha = pullRequest.head.sha;
    const resp = await this.request(`${this.originRepoURL}/commits/${sha}/status`);
    return resp.statuses.map(s => ({
      context: s.context,
      target_url: s.target_url,
      state: s.state === GitHubCommitStatusState.Success ? _decapCmsLibUtil.PreviewState.Success : _decapCmsLibUtil.PreviewState.Other
    }));
  }
  async persistFiles(dataFiles, mediaFiles, options) {
    const files = mediaFiles.concat(dataFiles);
    const uploadPromises = files.map(file => this.uploadBlob(file));
    await Promise.all(uploadPromises);
    if (!options.useWorkflow) {
      return this.getDefaultBranch().then(branchData => this.updateTree(branchData.commit.sha, files)).then(changeTree => this.commit(options.commitMessage, changeTree)).then(response => this.patchBranch(this.branch, response.sha));
    } else {
      const mediaFilesList = mediaFiles.map(({
        sha,
        path
      }) => ({
        path: (0, _trimStart2.default)(path, '/'),
        sha
      }));
      const slug = dataFiles[0].slug;
      return this.editorialWorkflowGit(files, slug, mediaFilesList, options);
    }
  }
  async getFileSha(path, {
    repoURL = this.repoURL,
    branch = this.branch
  } = {}) {
    /**
     * We need to request the tree first to get the SHA. We use extended SHA-1
     * syntax (<rev>:<path>) to get a blob from a tree without having to recurse
     * through the tree.
     */

    const pathArray = path.split('/');
    const filename = (0, _last2.default)(pathArray);
    const directory = (0, _initial2.default)(pathArray).join('/');
    const fileDataPath = encodeURIComponent(directory);
    const fileDataURL = `${repoURL}/git/trees/${branch}:${fileDataPath}`;
    const result = await this.request(fileDataURL);
    const file = result.tree.find(file => file.path === filename);
    if (file) {
      return file.sha;
    } else {
      throw new _decapCmsLibUtil.APIError('Not Found', 404, API_NAME);
    }
  }
  async deleteFiles(paths, message) {
    if (this.useOpenAuthoring) {
      return Promise.reject('Cannot delete published entries as an Open Authoring user!');
    }
    const branchData = await this.getDefaultBranch();
    const files = paths.map(path => ({
      path,
      sha: null
    }));
    const changeTree = await this.updateTree(branchData.commit.sha, files);
    const commit = await this.commit(message, changeTree);
    await this.patchBranch(this.branch, commit.sha);
  }
  async createBranchAndPullRequest(branchName, sha, commitMessage) {
    await this.createBranch(branchName, sha);
    return this.createPR(commitMessage, branchName);
  }
  async updatePullRequestLabels(number, labels) {
    await this.request(`${this.repoURL}/issues/${number}/labels`, {
      method: 'PUT',
      body: JSON.stringify({
        labels
      })
    });
  }

  // async since it is overridden in a child class
  async diffFromFile(diff) {
    return {
      path: diff.filename,
      newFile: diff.status === 'added',
      sha: diff.sha,
      // media files diffs don't have a patch attribute, except svg files
      // renamed files don't have a patch attribute too
      binary: diff.status !== 'renamed' && !diff.patch || diff.filename.endsWith('.svg')
    };
  }
  async editorialWorkflowGit(files, slug, mediaFilesList, options) {
    const contentKey = this.generateContentKey(options.collectionName, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      const branchData = await this.getDefaultBranch();
      const changeTree = await this.updateTree(branchData.commit.sha, files);
      const commitResponse = await this.commit(options.commitMessage, changeTree);
      if (this.useOpenAuthoring) {
        await this.createBranch(branch, commitResponse.sha);
      } else {
        const pr = await this.createBranchAndPullRequest(branch, commitResponse.sha, options.commitMessage);
        await this.setPullRequestStatus(pr, options.status || this.initialWorkflowStatus);
      }
    } else {
      // Entry is already on editorial review workflow - commit to existing branch
      const {
        files: diffFiles
      } = await this.getDifferences(this.branch, await this.getHeadReference(branch));
      const diffs = await Promise.all(diffFiles.map(file => this.diffFromFile(file)));
      // mark media files to remove
      const mediaFilesToRemove = [];
      for (const diff of diffs.filter(d => d.binary)) {
        if (!mediaFilesList.some(file => file.path === diff.path)) {
          mediaFilesToRemove.push({
            path: diff.path,
            sha: null
          });
        }
      }

      // rebase the branch before applying new changes
      const rebasedHead = await this.rebaseBranch(branch);
      const treeFiles = mediaFilesToRemove.concat(files);
      const changeTree = await this.updateTree(rebasedHead.sha, treeFiles, branch);
      const commit = await this.commit(options.commitMessage, changeTree);
      return this.patchBranch(branch, commit.sha, {
        force: true
      });
    }
  }
  async getDifferences(from, to) {
    // retry this as sometimes GitHub returns an initial 404 on cross repo compare
    const attempts = this.useOpenAuthoring ? 10 : 1;
    for (let i = 1; i <= attempts; i++) {
      try {
        const result = await this.request(`${this.originRepoURL}/compare/${from}...${to}`);
        return result;
      } catch (e) {
        if (i === attempts) {
          console.warn(`Reached maximum number of attempts '${attempts}' for getDifferences`);
          throw e;
        }
        await new Promise(resolve => setTimeout(resolve, i * 500));
      }
    }
    throw new _decapCmsLibUtil.APIError('Not Found', 404, API_NAME);
  }
  async rebaseSingleCommit(baseCommit, commit) {
    // first get the diff between the commits
    const result = await this.getDifferences(commit.parents[0].sha, commit.sha);
    const files = getTreeFiles(result.files);

    // only update the tree if changes were detected
    if (files.length > 0) {
      // create a tree with baseCommit as the base with the diff applied
      const tree = await this.updateTree(baseCommit.sha, files);
      const {
        message,
        author,
        committer
      } = commit.commit;

      // create a new commit from the updated tree
      const newCommit = await this.createCommit(message, tree.sha, [baseCommit.sha], author, committer);
      return newCommit;
    } else {
      return commit;
    }
  }

  /**
   * Rebase an array of commits one-by-one, starting from a given base SHA
   */
  async rebaseCommits(baseCommit, commits) {
    /**
     * If the parent of the first commit already matches the target base,
     * return commits as is.
     */
    if (commits.length === 0 || commits[0].parents[0].sha === baseCommit.sha) {
      const head = (0, _last2.default)(commits);
      return head;
    } else {
      /**
       * Re-create each commit over the new base, applying each to the previous,
       * changing only the parent SHA and tree for each, but retaining all other
       * info, such as the author/committer data.
       */
      const newHeadPromise = commits.reduce((lastCommitPromise, commit) => {
        return lastCommitPromise.then(newParent => {
          const parent = newParent;
          const commitToRebase = commit;
          return this.rebaseSingleCommit(parent, commitToRebase);
        });
      }, Promise.resolve(baseCommit));
      return newHeadPromise;
    }
  }
  async rebaseBranch(branch) {
    try {
      // Get the diff between the default branch the published branch
      const {
        base_commit: baseCommit,
        commits
      } = await this.getDifferences(this.branch, await this.getHeadReference(branch));
      // Rebase the branch based on the diff
      const rebasedHead = await this.rebaseCommits(baseCommit, commits);
      return rebasedHead;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async setPullRequestStatus(pullRequest, newStatus) {
    const labels = [...pullRequest.labels.filter(label => !(0, _decapCmsLibUtil.isCMSLabel)(label.name, this.cmsLabelPrefix)).map(l => l.name), (0, _decapCmsLibUtil.statusToLabel)(newStatus, this.cmsLabelPrefix)];
    await this.updatePullRequestLabels(pullRequest.number, labels);
  }
  async updateUnpublishedEntryStatus(collectionName, slug, newStatus) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    if (!this.useOpenAuthoring) {
      await this.setPullRequestStatus(pullRequest, newStatus);
    } else {
      if (status === 'pending_publish') {
        throw new Error('Open Authoring entries may not be set to the status "pending_publish".');
      }
      if (pullRequest.number !== MOCK_PULL_REQUEST) {
        const {
          state
        } = pullRequest;
        if (state === PullRequestState.Open && newStatus === 'draft') {
          await this.closePR(pullRequest.number);
        }
        if (state === PullRequestState.Closed && newStatus === 'pending_review') {
          await this.openPR(pullRequest.number);
        }
      } else if (newStatus === 'pending_review') {
        var _diff$commits$, _diff$commits$$commit;
        const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
        // get the first commit message as the pr title
        const diff = await this.getDifferences(this.branch, await this.getHeadReference(branch));
        const title = ((_diff$commits$ = diff.commits[0]) === null || _diff$commits$ === void 0 ? void 0 : (_diff$commits$$commit = _diff$commits$.commit) === null || _diff$commits$$commit === void 0 ? void 0 : _diff$commits$$commit.message) || API.DEFAULT_COMMIT_MESSAGE;
        await this.createPR(title, branch);
      }
    }
  }
  async deleteUnpublishedEntry(collectionName, slug) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    if (pullRequest.number !== MOCK_PULL_REQUEST) {
      await this.closePR(pullRequest.number);
    }
    await this.deleteBranch(branch);
  }
  async publishUnpublishedEntry(collectionName, slug) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    await this.mergePR(pullRequest);
    await this.deleteBranch(branch);
  }
  async createRef(type, name, sha) {
    const result = await this.request(`${this.repoURL}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/${type}/${name}`,
        sha
      })
    });
    return result;
  }
  async patchRef(type, name, sha, opts = {}) {
    const force = opts.force || false;
    const result = await this.request(`${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha,
        force
      })
    });
    return result;
  }
  deleteRef(type, name) {
    return this.request(`${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
  }
  async getBranch(branch) {
    const result = await this.request(`${this.repoURL}/branches/${encodeURIComponent(branch)}`);
    return result;
  }
  async getDefaultBranch() {
    const result = await this.request(`${this.originRepoURL}/branches/${encodeURIComponent(this.branch)}`);
    return result;
  }
  async backupBranch(branchName) {
    try {
      const existingBranch = await this.getBranch(branchName);
      await this.createBranch(existingBranch.name.replace(new RegExp(`${_decapCmsLibUtil.CMS_BRANCH_PREFIX}/`), `${_decapCmsLibUtil.CMS_BRANCH_PREFIX}_${Date.now()}/`), existingBranch.commit.sha);
    } catch (e) {
      console.warn(e);
    }
  }
  async createBranch(branchName, sha) {
    try {
      const result = await this.createRef('heads', branchName, sha);
      return result;
    } catch (e) {
      const message = String(e.message || '');
      if (message === 'Reference update failed') {
        await (0, _decapCmsLibUtil.throwOnConflictingBranches)(branchName, name => this.getBranch(name), API_NAME);
      } else if (message === 'Reference already exists' && branchName.startsWith(`${_decapCmsLibUtil.CMS_BRANCH_PREFIX}/`)) {
        try {
          // this can happen if the branch wasn't deleted when the PR was merged
          // we backup the existing branch just in case and patch it with the new sha
          await this.backupBranch(branchName);
          const result = await this.patchBranch(branchName, sha, {
            force: true
          });
          return result;
        } catch (e) {
          console.log(e);
        }
      }
      throw e;
    }
  }
  assertCmsBranch(branchName) {
    return branchName.startsWith(`${_decapCmsLibUtil.CMS_BRANCH_PREFIX}/`);
  }
  patchBranch(branchName, sha, opts = {}) {
    const force = opts.force || false;
    if (force && !this.assertCmsBranch(branchName)) {
      throw Error(`Only CMS branches can be force updated, cannot force update ${branchName}`);
    }
    return this.patchRef('heads', branchName, sha, {
      force
    });
  }
  deleteBranch(branchName) {
    return this.deleteRef('heads', branchName).catch(err => {
      // If the branch doesn't exist, then it has already been deleted -
      // deletion should be idempotent, so we can consider this a
      // success.
      if (err.message === 'Reference does not exist') {
        return Promise.resolve();
      }
      console.error(err);
      return Promise.reject(err);
    });
  }
  async getHeadReference(head) {
    return `${this.repoOwner}:${head}`;
  }
  async createPR(title, head) {
    const result = await this.request(`${this.originRepoURL}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: _decapCmsLibUtil.DEFAULT_PR_BODY,
        head: await this.getHeadReference(head),
        base: this.branch
      })
    });
    return result;
  }
  async openPR(number) {
    console.log('%c Re-opening PR', 'line-height: 30px;text-align: center;font-weight: bold');
    const result = await this.request(`${this.originRepoURL}/pulls/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: PullRequestState.Open
      })
    });
    return result;
  }
  async closePR(number) {
    console.log('%c Deleting PR', 'line-height: 30px;text-align: center;font-weight: bold');
    const result = await this.request(`${this.originRepoURL}/pulls/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: PullRequestState.Closed
      })
    });
    return result;
  }
  async mergePR(pullrequest) {
    console.log('%c Merging PR', 'line-height: 30px;text-align: center;font-weight: bold');
    try {
      const result = await this.request(`${this.originRepoURL}/pulls/${pullrequest.number}/merge`, {
        method: 'PUT',
        body: JSON.stringify({
          commit_message: _decapCmsLibUtil.MERGE_COMMIT_MESSAGE,
          sha: pullrequest.head.sha,
          merge_method: this.mergeMethod
        })
      });
      return result;
    } catch (error) {
      if (error instanceof _decapCmsLibUtil.APIError && error.status === 405) {
        return this.forceMergePR(pullrequest);
      } else {
        throw error;
      }
    }
  }
  async forceMergePR(pullRequest) {
    const result = await this.getDifferences(pullRequest.base.sha, pullRequest.head.sha);
    const files = getTreeFiles(result.files);
    let commitMessage = 'Automatically generated. Merged on Decap CMS\n\nForce merge of:';
    files.forEach(file => {
      commitMessage += `\n* "${file.path}"`;
    });
    console.log('%c Automatic merge not possible - Forcing merge.', 'line-height: 30px;text-align: center;font-weight: bold');
    return this.getDefaultBranch().then(branchData => this.updateTree(branchData.commit.sha, files)).then(changeTree => this.commit(commitMessage, changeTree)).then(response => this.patchBranch(this.branch, response.sha));
  }
  toBase64(str) {
    return Promise.resolve(_jsBase.Base64.encode(str));
  }
  async uploadBlob(item) {
    const contentBase64 = await (0, _result2.default)(item, 'toBase64', (0, _partial2.default)(this.toBase64, item.raw));
    const response = await this.request(`${this.repoURL}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: contentBase64,
        encoding: 'base64'
      })
    });
    item.sha = response.sha;
    return item;
  }
  async updateTree(baseSha, files, branch = this.branch) {
    const toMove = [];
    const tree = files.reduce((acc, file) => {
      const entry = {
        path: (0, _trimStart2.default)(file.path, '/'),
        mode: '100644',
        type: 'blob',
        sha: file.sha
      };
      if (file.newPath) {
        toMove.push({
          from: file.path,
          to: file.newPath,
          sha: file.sha
        });
      } else {
        acc.push(entry);
      }
      return acc;
    }, []);
    for (const {
      from,
      to,
      sha
    } of toMove) {
      const sourceDir = (0, _path.dirname)(from);
      const destDir = (0, _path.dirname)(to);
      const files = await this.listFiles(sourceDir, {
        branch,
        depth: 100
      });
      for (const file of files) {
        // delete current path
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null
        });
        // create in new path
        tree.push({
          path: file.path.replace(sourceDir, destDir),
          mode: '100644',
          type: 'blob',
          sha: file.path === from ? sha : file.id
        });
      }
    }
    const newTree = await this.createTree(baseSha, tree);
    return _objectSpread(_objectSpread({}, newTree), {}, {
      parentSha: baseSha
    });
  }
  async createTree(baseSha, tree) {
    const result = await this.request(`${this.repoURL}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseSha,
        tree
      })
    });
    return result;
  }
  commit(message, changeTree) {
    const parents = changeTree.parentSha ? [changeTree.parentSha] : [];
    return this.createCommit(message, changeTree.sha, parents);
  }
  async createCommit(message, treeSha, parents, author, committer) {
    const result = await this.request(`${this.repoURL}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeSha,
        parents,
        author,
        committer
      })
    });
    return result;
  }
  async getUnpublishedEntrySha(collection, slug) {
    const contentKey = this.generateContentKey(collection, slug);
    const branch = (0, _decapCmsLibUtil.branchFromContentKey)(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    return pullRequest.head.sha;
  }
}
exports.default = API;
_defineProperty(API, "DEFAULT_COMMIT_MESSAGE", 'Automatically generated by Decap CMS');