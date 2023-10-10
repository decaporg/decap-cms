"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "APIError", {
  enumerable: true,
  get: function () {
    return _APIError.default;
  }
});
Object.defineProperty(exports, "AccessTokenError", {
  enumerable: true,
  get: function () {
    return _AccessTokenError.default;
  }
});
Object.defineProperty(exports, "CMS_BRANCH_PREFIX", {
  enumerable: true,
  get: function () {
    return _APIUtils.CMS_BRANCH_PREFIX;
  }
});
Object.defineProperty(exports, "CURSOR_COMPATIBILITY_SYMBOL", {
  enumerable: true,
  get: function () {
    return _Cursor.CURSOR_COMPATIBILITY_SYMBOL;
  }
});
Object.defineProperty(exports, "Cursor", {
  enumerable: true,
  get: function () {
    return _Cursor.default;
  }
});
Object.defineProperty(exports, "DEFAULT_PR_BODY", {
  enumerable: true,
  get: function () {
    return _APIUtils.DEFAULT_PR_BODY;
  }
});
exports.DecapCmsLibUtil = void 0;
Object.defineProperty(exports, "EDITORIAL_WORKFLOW_ERROR", {
  enumerable: true,
  get: function () {
    return _EditorialWorkflowError.EDITORIAL_WORKFLOW_ERROR;
  }
});
Object.defineProperty(exports, "EditorialWorkflowError", {
  enumerable: true,
  get: function () {
    return _EditorialWorkflowError.default;
  }
});
Object.defineProperty(exports, "MERGE_COMMIT_MESSAGE", {
  enumerable: true,
  get: function () {
    return _APIUtils.MERGE_COMMIT_MESSAGE;
  }
});
Object.defineProperty(exports, "PreviewState", {
  enumerable: true,
  get: function () {
    return _API.PreviewState;
  }
});
Object.defineProperty(exports, "allEntriesByFolder", {
  enumerable: true,
  get: function () {
    return _implementation.allEntriesByFolder;
  }
});
Object.defineProperty(exports, "asyncLock", {
  enumerable: true,
  get: function () {
    return _asyncLock.asyncLock;
  }
});
Object.defineProperty(exports, "basename", {
  enumerable: true,
  get: function () {
    return _path.basename;
  }
});
Object.defineProperty(exports, "blobToFileObj", {
  enumerable: true,
  get: function () {
    return _implementation.blobToFileObj;
  }
});
Object.defineProperty(exports, "branchFromContentKey", {
  enumerable: true,
  get: function () {
    return _APIUtils.branchFromContentKey;
  }
});
Object.defineProperty(exports, "contentKeyFromBranch", {
  enumerable: true,
  get: function () {
    return _APIUtils.contentKeyFromBranch;
  }
});
Object.defineProperty(exports, "createPointerFile", {
  enumerable: true,
  get: function () {
    return _gitLfs.createPointerFile;
  }
});
Object.defineProperty(exports, "entriesByFiles", {
  enumerable: true,
  get: function () {
    return _implementation.entriesByFiles;
  }
});
Object.defineProperty(exports, "entriesByFolder", {
  enumerable: true,
  get: function () {
    return _implementation.entriesByFolder;
  }
});
Object.defineProperty(exports, "fileExtension", {
  enumerable: true,
  get: function () {
    return _path.fileExtension;
  }
});
Object.defineProperty(exports, "fileExtensionWithSeparator", {
  enumerable: true,
  get: function () {
    return _path.fileExtensionWithSeparator;
  }
});
Object.defineProperty(exports, "filterByExtension", {
  enumerable: true,
  get: function () {
    return _backendUtil.filterByExtension;
  }
});
Object.defineProperty(exports, "flowAsync", {
  enumerable: true,
  get: function () {
    return _promise.flowAsync;
  }
});
Object.defineProperty(exports, "generateContentKey", {
  enumerable: true,
  get: function () {
    return _APIUtils.generateContentKey;
  }
});
Object.defineProperty(exports, "getAllResponses", {
  enumerable: true,
  get: function () {
    return _backendUtil.getAllResponses;
  }
});
Object.defineProperty(exports, "getBlobSHA", {
  enumerable: true,
  get: function () {
    return _getBlobSHA.default;
  }
});
Object.defineProperty(exports, "getLargeMediaFilteredMediaFiles", {
  enumerable: true,
  get: function () {
    return _gitLfs.getLargeMediaFilteredMediaFiles;
  }
});
Object.defineProperty(exports, "getLargeMediaPatternsFromGitAttributesFile", {
  enumerable: true,
  get: function () {
    return _gitLfs.getLargeMediaPatternsFromGitAttributesFile;
  }
});
Object.defineProperty(exports, "getMediaAsBlob", {
  enumerable: true,
  get: function () {
    return _implementation.getMediaAsBlob;
  }
});
Object.defineProperty(exports, "getMediaDisplayURL", {
  enumerable: true,
  get: function () {
    return _implementation.getMediaDisplayURL;
  }
});
Object.defineProperty(exports, "getPathDepth", {
  enumerable: true,
  get: function () {
    return _backendUtil.getPathDepth;
  }
});
Object.defineProperty(exports, "getPointerFileForMediaFileObj", {
  enumerable: true,
  get: function () {
    return _gitLfs.getPointerFileForMediaFileObj;
  }
});
Object.defineProperty(exports, "getPreviewStatus", {
  enumerable: true,
  get: function () {
    return _API.getPreviewStatus;
  }
});
Object.defineProperty(exports, "isAbsolutePath", {
  enumerable: true,
  get: function () {
    return _path.isAbsolutePath;
  }
});
Object.defineProperty(exports, "isCMSLabel", {
  enumerable: true,
  get: function () {
    return _APIUtils.isCMSLabel;
  }
});
Object.defineProperty(exports, "isPreviewContext", {
  enumerable: true,
  get: function () {
    return _API.isPreviewContext;
  }
});
Object.defineProperty(exports, "labelToStatus", {
  enumerable: true,
  get: function () {
    return _APIUtils.labelToStatus;
  }
});
Object.defineProperty(exports, "loadScript", {
  enumerable: true,
  get: function () {
    return _loadScript.default;
  }
});
Object.defineProperty(exports, "localForage", {
  enumerable: true,
  get: function () {
    return _localForage.default;
  }
});
Object.defineProperty(exports, "onlySuccessfulPromises", {
  enumerable: true,
  get: function () {
    return _promise.onlySuccessfulPromises;
  }
});
Object.defineProperty(exports, "parseContentKey", {
  enumerable: true,
  get: function () {
    return _APIUtils.parseContentKey;
  }
});
Object.defineProperty(exports, "parseLinkHeader", {
  enumerable: true,
  get: function () {
    return _backendUtil.parseLinkHeader;
  }
});
Object.defineProperty(exports, "parsePointerFile", {
  enumerable: true,
  get: function () {
    return _gitLfs.parsePointerFile;
  }
});
Object.defineProperty(exports, "parseResponse", {
  enumerable: true,
  get: function () {
    return _backendUtil.parseResponse;
  }
});
Object.defineProperty(exports, "readFile", {
  enumerable: true,
  get: function () {
    return _API.readFile;
  }
});
Object.defineProperty(exports, "readFileMetadata", {
  enumerable: true,
  get: function () {
    return _API.readFileMetadata;
  }
});
Object.defineProperty(exports, "requestWithBackoff", {
  enumerable: true,
  get: function () {
    return _API.requestWithBackoff;
  }
});
Object.defineProperty(exports, "responseParser", {
  enumerable: true,
  get: function () {
    return _backendUtil.responseParser;
  }
});
Object.defineProperty(exports, "runWithLock", {
  enumerable: true,
  get: function () {
    return _implementation.runWithLock;
  }
});
Object.defineProperty(exports, "statusToLabel", {
  enumerable: true,
  get: function () {
    return _APIUtils.statusToLabel;
  }
});
Object.defineProperty(exports, "then", {
  enumerable: true,
  get: function () {
    return _promise.then;
  }
});
Object.defineProperty(exports, "throwOnConflictingBranches", {
  enumerable: true,
  get: function () {
    return _API.throwOnConflictingBranches;
  }
});
Object.defineProperty(exports, "unpublishedEntries", {
  enumerable: true,
  get: function () {
    return _implementation.unpublishedEntries;
  }
});
Object.defineProperty(exports, "unsentRequest", {
  enumerable: true,
  get: function () {
    return _unsentRequest.default;
  }
});
var _APIError = _interopRequireDefault(require("./APIError"));
var _Cursor = _interopRequireWildcard(require("./Cursor"));
var _EditorialWorkflowError = _interopRequireWildcard(require("./EditorialWorkflowError"));
var _AccessTokenError = _interopRequireDefault(require("./AccessTokenError"));
var _localForage = _interopRequireDefault(require("./localForage"));
var _path = require("./path");
var _promise = require("./promise");
var _unsentRequest = _interopRequireDefault(require("./unsentRequest"));
var _backendUtil = require("./backendUtil");
var _loadScript = _interopRequireDefault(require("./loadScript"));
var _getBlobSHA = _interopRequireDefault(require("./getBlobSHA"));
var _asyncLock = require("./asyncLock");
var _implementation = require("./implementation");
var _API = require("./API");
var _APIUtils = require("./APIUtils");
var _gitLfs = require("./git-lfs");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DecapCmsLibUtil = {
  APIError: _APIError.default,
  Cursor: _Cursor.default,
  CURSOR_COMPATIBILITY_SYMBOL: _Cursor.CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError: _EditorialWorkflowError.default,
  EDITORIAL_WORKFLOW_ERROR: _EditorialWorkflowError.EDITORIAL_WORKFLOW_ERROR,
  localForage: _localForage.default,
  basename: _path.basename,
  fileExtensionWithSeparator: _path.fileExtensionWithSeparator,
  fileExtension: _path.fileExtension,
  onlySuccessfulPromises: _promise.onlySuccessfulPromises,
  flowAsync: _promise.flowAsync,
  then: _promise.then,
  unsentRequest: _unsentRequest.default,
  filterByExtension: _backendUtil.filterByExtension,
  parseLinkHeader: _backendUtil.parseLinkHeader,
  parseResponse: _backendUtil.parseResponse,
  responseParser: _backendUtil.responseParser,
  loadScript: _loadScript.default,
  getBlobSHA: _getBlobSHA.default,
  getPathDepth: _backendUtil.getPathDepth,
  entriesByFiles: _implementation.entriesByFiles,
  entriesByFolder: _implementation.entriesByFolder,
  unpublishedEntries: _implementation.unpublishedEntries,
  getMediaDisplayURL: _implementation.getMediaDisplayURL,
  getMediaAsBlob: _implementation.getMediaAsBlob,
  readFile: _API.readFile,
  readFileMetadata: _API.readFileMetadata,
  CMS_BRANCH_PREFIX: _APIUtils.CMS_BRANCH_PREFIX,
  generateContentKey: _APIUtils.generateContentKey,
  isCMSLabel: _APIUtils.isCMSLabel,
  labelToStatus: _APIUtils.labelToStatus,
  statusToLabel: _APIUtils.statusToLabel,
  DEFAULT_PR_BODY: _APIUtils.DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE: _APIUtils.MERGE_COMMIT_MESSAGE,
  isPreviewContext: _API.isPreviewContext,
  getPreviewStatus: _API.getPreviewStatus,
  runWithLock: _implementation.runWithLock,
  PreviewState: _API.PreviewState,
  parseContentKey: _APIUtils.parseContentKey,
  createPointerFile: _gitLfs.createPointerFile,
  getLargeMediaFilteredMediaFiles: _gitLfs.getLargeMediaFilteredMediaFiles,
  getLargeMediaPatternsFromGitAttributesFile: _gitLfs.getLargeMediaPatternsFromGitAttributesFile,
  parsePointerFile: _gitLfs.parsePointerFile,
  getPointerFileForMediaFileObj: _gitLfs.getPointerFileForMediaFileObj,
  branchFromContentKey: _APIUtils.branchFromContentKey,
  contentKeyFromBranch: _APIUtils.contentKeyFromBranch,
  blobToFileObj: _implementation.blobToFileObj,
  requestWithBackoff: _API.requestWithBackoff,
  allEntriesByFolder: _implementation.allEntriesByFolder,
  AccessTokenError: _AccessTokenError.default,
  throwOnConflictingBranches: _API.throwOnConflictingBranches
};
exports.DecapCmsLibUtil = DecapCmsLibUtil;