"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.selectDeployPreview = selectDeployPreview;
exports.selectEntries = selectEntries;
exports.selectEntry = selectEntry;
exports.selectIntegration = selectIntegration;
exports.selectPublishedSlugs = selectPublishedSlugs;
exports.selectSearchedEntries = selectSearchedEntries;
exports.selectUnpublishedEntriesByStatus = selectUnpublishedEntriesByStatus;
exports.selectUnpublishedEntry = selectUnpublishedEntry;
exports.selectUnpublishedSlugs = selectUnpublishedSlugs;
var _immutable = require("immutable");
var _auth = _interopRequireDefault(require("./auth"));
var _config = _interopRequireDefault(require("./config"));
var fromIntegrations = _interopRequireWildcard(require("./integrations"));
var fromEntries = _interopRequireWildcard(require("./entries"));
var _cursors = _interopRequireDefault(require("./cursors"));
var fromEditorialWorkflow = _interopRequireWildcard(require("./editorialWorkflow"));
var _entryDraft = _interopRequireDefault(require("./entryDraft"));
var _collections = _interopRequireDefault(require("./collections"));
var _search = _interopRequireDefault(require("./search"));
var _medias = _interopRequireDefault(require("./medias"));
var _mediaLibrary = _interopRequireDefault(require("./mediaLibrary"));
var fromDeploys = _interopRequireWildcard(require("./deploys"));
var _globalUI = _interopRequireDefault(require("./globalUI"));
var _status = _interopRequireDefault(require("./status"));
var _notifications = _interopRequireDefault(require("./notifications"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const reducers = {
  auth: _auth.default,
  config: _config.default,
  collections: _collections.default,
  search: _search.default,
  integrations: fromIntegrations.default,
  entries: fromEntries.default,
  cursors: _cursors.default,
  editorialWorkflow: fromEditorialWorkflow.default,
  entryDraft: _entryDraft.default,
  medias: _medias.default,
  mediaLibrary: _mediaLibrary.default,
  deploys: fromDeploys.default,
  globalUI: _globalUI.default,
  status: _status.default,
  notifications: _notifications.default
};
var _default = reducers;
/*
 * Selectors
 */
exports.default = _default;
function selectEntry(state, collection, slug) {
  return fromEntries.selectEntry(state.entries, collection, slug);
}
function selectEntries(state, collection) {
  return fromEntries.selectEntries(state.entries, collection);
}
function selectPublishedSlugs(state, collection) {
  return fromEntries.selectPublishedSlugs(state.entries, collection);
}
function selectSearchedEntries(state, availableCollections) {
  // only return search results for actually available collections
  return (0, _immutable.List)(state.search.entryIds).filter(entryId => availableCollections.indexOf(entryId.collection) !== -1).map(entryId => fromEntries.selectEntry(state.entries, entryId.collection, entryId.slug));
}
function selectDeployPreview(state, collection, slug) {
  return fromDeploys.selectDeployPreview(state.deploys, collection, slug);
}
function selectUnpublishedEntry(state, collection, slug) {
  return fromEditorialWorkflow.selectUnpublishedEntry(state.editorialWorkflow, collection, slug);
}
function selectUnpublishedEntriesByStatus(state, status) {
  return fromEditorialWorkflow.selectUnpublishedEntriesByStatus(state.editorialWorkflow, status);
}
function selectUnpublishedSlugs(state, collection) {
  return fromEditorialWorkflow.selectUnpublishedSlugs(state.editorialWorkflow, collection);
}
function selectIntegration(state, collection, hook) {
  return fromIntegrations.selectIntegration(state.integrations, collection, hook);
}