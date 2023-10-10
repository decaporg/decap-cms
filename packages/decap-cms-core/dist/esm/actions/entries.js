"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SORT_ENTRIES_SUCCESS = exports.SORT_ENTRIES_REQUEST = exports.SORT_ENTRIES_FAILURE = exports.REMOVE_DRAFT_ENTRY_MEDIA_FILE = exports.GROUP_ENTRIES_SUCCESS = exports.GROUP_ENTRIES_REQUEST = exports.GROUP_ENTRIES_FAILURE = exports.FILTER_ENTRIES_SUCCESS = exports.FILTER_ENTRIES_REQUEST = exports.FILTER_ENTRIES_FAILURE = exports.ENTRY_SUCCESS = exports.ENTRY_REQUEST = exports.ENTRY_PERSIST_SUCCESS = exports.ENTRY_PERSIST_REQUEST = exports.ENTRY_PERSIST_FAILURE = exports.ENTRY_FAILURE = exports.ENTRY_DELETE_SUCCESS = exports.ENTRY_DELETE_REQUEST = exports.ENTRY_DELETE_FAILURE = exports.ENTRIES_SUCCESS = exports.ENTRIES_REQUEST = exports.ENTRIES_FAILURE = exports.DRAFT_VALIDATION_ERRORS = exports.DRAFT_LOCAL_BACKUP_RETRIEVED = exports.DRAFT_DISCARD = exports.DRAFT_CREATE_FROM_LOCAL_BACKUP = exports.DRAFT_CREATE_FROM_ENTRY = exports.DRAFT_CREATE_EMPTY = exports.DRAFT_CREATE_DUPLICATE_FROM_ENTRY = exports.DRAFT_CLEAR_ERRORS = exports.DRAFT_CHANGE_FIELD = exports.CHANGE_VIEW_STYLE = exports.ADD_DRAFT_ENTRY_MEDIA_FILE = void 0;
exports.addDraftEntryMediaFile = addDraftEntryMediaFile;
exports.changeDraftField = changeDraftField;
exports.changeDraftFieldValidation = changeDraftFieldValidation;
exports.changeViewStyle = changeViewStyle;
exports.clearFieldErrors = clearFieldErrors;
exports.createDraftDuplicateFromEntry = createDraftDuplicateFromEntry;
exports.createDraftFromEntry = createDraftFromEntry;
exports.createEmptyDraft = createEmptyDraft;
exports.createEmptyDraftData = createEmptyDraftData;
exports.deleteEntry = deleteEntry;
exports.deleteLocalBackup = deleteLocalBackup;
exports.discardDraft = discardDraft;
exports.draftDuplicateEntry = draftDuplicateEntry;
exports.emptyDraftCreated = emptyDraftCreated;
exports.entriesFailed = entriesFailed;
exports.entriesLoaded = entriesLoaded;
exports.entriesLoading = entriesLoading;
exports.entryDeleteFail = entryDeleteFail;
exports.entryDeleted = entryDeleted;
exports.entryDeleting = entryDeleting;
exports.entryLoadError = entryLoadError;
exports.entryLoaded = entryLoaded;
exports.entryLoading = entryLoading;
exports.entryPersistFail = entryPersistFail;
exports.entryPersisted = entryPersisted;
exports.entryPersisting = entryPersisting;
exports.filterByField = filterByField;
exports.getMediaAssets = getMediaAssets;
exports.getSerializedEntry = getSerializedEntry;
exports.groupByField = groupByField;
exports.loadEntries = loadEntries;
exports.loadEntry = loadEntry;
exports.loadLocalBackup = loadLocalBackup;
exports.localBackupRetrieved = localBackupRetrieved;
exports.persistEntry = persistEntry;
exports.persistLocalBackup = persistLocalBackup;
exports.removeDraftEntryMediaFile = removeDraftEntryMediaFile;
exports.retrieveLocalBackup = retrieveLocalBackup;
exports.sortByField = sortByField;
exports.traverseCollectionCursor = traverseCollectionCursor;
exports.tryLoadEntry = tryLoadEntry;
exports.validateMetaField = validateMetaField;
var _isEqual2 = _interopRequireDefault(require("lodash/isEqual"));
var _immutable = require("immutable");
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _cursors = require("../reducers/cursors");
var _collections = require("../reducers/collections");
var _reducers = require("../reducers");
var _integrations = require("../integrations");
var _backend = require("../backend");
var _serializeEntryValues = require("../lib/serializeEntryValues");
var _Entry = require("../valueObjects/Entry");
var _AssetProxy = require("../valueObjects/AssetProxy");
var _validationErrorTypes = _interopRequireDefault(require("../constants/validationErrorTypes"));
var _media = require("./media");
var _redux = require("../types/redux");
var _mediaLibrary = require("./mediaLibrary");
var _waitUntil = require("./waitUntil");
var _entries = require("../reducers/entries");
var _entryDraft = require("../reducers/entryDraft");
var _history = require("../routing/history");
var _formatters = require("../lib/formatters");
var _i18n = require("../lib/i18n");
var _notifications = require("./notifications");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/*
 * Constant Declarations
 */
const ENTRY_REQUEST = 'ENTRY_REQUEST';
exports.ENTRY_REQUEST = ENTRY_REQUEST;
const ENTRY_SUCCESS = 'ENTRY_SUCCESS';
exports.ENTRY_SUCCESS = ENTRY_SUCCESS;
const ENTRY_FAILURE = 'ENTRY_FAILURE';
exports.ENTRY_FAILURE = ENTRY_FAILURE;
const ENTRIES_REQUEST = 'ENTRIES_REQUEST';
exports.ENTRIES_REQUEST = ENTRIES_REQUEST;
const ENTRIES_SUCCESS = 'ENTRIES_SUCCESS';
exports.ENTRIES_SUCCESS = ENTRIES_SUCCESS;
const ENTRIES_FAILURE = 'ENTRIES_FAILURE';
exports.ENTRIES_FAILURE = ENTRIES_FAILURE;
const SORT_ENTRIES_REQUEST = 'SORT_ENTRIES_REQUEST';
exports.SORT_ENTRIES_REQUEST = SORT_ENTRIES_REQUEST;
const SORT_ENTRIES_SUCCESS = 'SORT_ENTRIES_SUCCESS';
exports.SORT_ENTRIES_SUCCESS = SORT_ENTRIES_SUCCESS;
const SORT_ENTRIES_FAILURE = 'SORT_ENTRIES_FAILURE';
exports.SORT_ENTRIES_FAILURE = SORT_ENTRIES_FAILURE;
const FILTER_ENTRIES_REQUEST = 'FILTER_ENTRIES_REQUEST';
exports.FILTER_ENTRIES_REQUEST = FILTER_ENTRIES_REQUEST;
const FILTER_ENTRIES_SUCCESS = 'FILTER_ENTRIES_SUCCESS';
exports.FILTER_ENTRIES_SUCCESS = FILTER_ENTRIES_SUCCESS;
const FILTER_ENTRIES_FAILURE = 'FILTER_ENTRIES_FAILURE';
exports.FILTER_ENTRIES_FAILURE = FILTER_ENTRIES_FAILURE;
const GROUP_ENTRIES_REQUEST = 'GROUP_ENTRIES_REQUEST';
exports.GROUP_ENTRIES_REQUEST = GROUP_ENTRIES_REQUEST;
const GROUP_ENTRIES_SUCCESS = 'GROUP_ENTRIES_SUCCESS';
exports.GROUP_ENTRIES_SUCCESS = GROUP_ENTRIES_SUCCESS;
const GROUP_ENTRIES_FAILURE = 'GROUP_ENTRIES_FAILURE';
exports.GROUP_ENTRIES_FAILURE = GROUP_ENTRIES_FAILURE;
const DRAFT_CREATE_FROM_ENTRY = 'DRAFT_CREATE_FROM_ENTRY';
exports.DRAFT_CREATE_FROM_ENTRY = DRAFT_CREATE_FROM_ENTRY;
const DRAFT_CREATE_EMPTY = 'DRAFT_CREATE_EMPTY';
exports.DRAFT_CREATE_EMPTY = DRAFT_CREATE_EMPTY;
const DRAFT_DISCARD = 'DRAFT_DISCARD';
exports.DRAFT_DISCARD = DRAFT_DISCARD;
const DRAFT_CHANGE_FIELD = 'DRAFT_CHANGE_FIELD';
exports.DRAFT_CHANGE_FIELD = DRAFT_CHANGE_FIELD;
const DRAFT_VALIDATION_ERRORS = 'DRAFT_VALIDATION_ERRORS';
exports.DRAFT_VALIDATION_ERRORS = DRAFT_VALIDATION_ERRORS;
const DRAFT_CLEAR_ERRORS = 'DRAFT_CLEAR_ERRORS';
exports.DRAFT_CLEAR_ERRORS = DRAFT_CLEAR_ERRORS;
const DRAFT_LOCAL_BACKUP_RETRIEVED = 'DRAFT_LOCAL_BACKUP_RETRIEVED';
exports.DRAFT_LOCAL_BACKUP_RETRIEVED = DRAFT_LOCAL_BACKUP_RETRIEVED;
const DRAFT_CREATE_FROM_LOCAL_BACKUP = 'DRAFT_CREATE_FROM_LOCAL_BACKUP';
exports.DRAFT_CREATE_FROM_LOCAL_BACKUP = DRAFT_CREATE_FROM_LOCAL_BACKUP;
const DRAFT_CREATE_DUPLICATE_FROM_ENTRY = 'DRAFT_CREATE_DUPLICATE_FROM_ENTRY';
exports.DRAFT_CREATE_DUPLICATE_FROM_ENTRY = DRAFT_CREATE_DUPLICATE_FROM_ENTRY;
const ENTRY_PERSIST_REQUEST = 'ENTRY_PERSIST_REQUEST';
exports.ENTRY_PERSIST_REQUEST = ENTRY_PERSIST_REQUEST;
const ENTRY_PERSIST_SUCCESS = 'ENTRY_PERSIST_SUCCESS';
exports.ENTRY_PERSIST_SUCCESS = ENTRY_PERSIST_SUCCESS;
const ENTRY_PERSIST_FAILURE = 'ENTRY_PERSIST_FAILURE';
exports.ENTRY_PERSIST_FAILURE = ENTRY_PERSIST_FAILURE;
const ENTRY_DELETE_REQUEST = 'ENTRY_DELETE_REQUEST';
exports.ENTRY_DELETE_REQUEST = ENTRY_DELETE_REQUEST;
const ENTRY_DELETE_SUCCESS = 'ENTRY_DELETE_SUCCESS';
exports.ENTRY_DELETE_SUCCESS = ENTRY_DELETE_SUCCESS;
const ENTRY_DELETE_FAILURE = 'ENTRY_DELETE_FAILURE';
exports.ENTRY_DELETE_FAILURE = ENTRY_DELETE_FAILURE;
const ADD_DRAFT_ENTRY_MEDIA_FILE = 'ADD_DRAFT_ENTRY_MEDIA_FILE';
exports.ADD_DRAFT_ENTRY_MEDIA_FILE = ADD_DRAFT_ENTRY_MEDIA_FILE;
const REMOVE_DRAFT_ENTRY_MEDIA_FILE = 'REMOVE_DRAFT_ENTRY_MEDIA_FILE';
exports.REMOVE_DRAFT_ENTRY_MEDIA_FILE = REMOVE_DRAFT_ENTRY_MEDIA_FILE;
const CHANGE_VIEW_STYLE = 'CHANGE_VIEW_STYLE';

/*
 * Simple Action Creators (Internal)
 * We still need to export them for tests
 */
exports.CHANGE_VIEW_STYLE = CHANGE_VIEW_STYLE;
function entryLoading(collection, slug) {
  return {
    type: ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug
    }
  };
}
function entryLoaded(collection, entry) {
  return {
    type: ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry
    }
  };
}
function entryLoadError(error, collection, slug) {
  return {
    type: ENTRY_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug
    }
  };
}
function entriesLoading(collection) {
  return {
    type: ENTRIES_REQUEST,
    payload: {
      collection: collection.get('name')
    }
  };
}
function entriesLoaded(collection, entries, pagination, cursor, append = true) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries,
      page: pagination,
      cursor: _decapCmsLibUtil.Cursor.create(cursor),
      append
    }
  };
}
function entriesFailed(collection, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: {
      collection: collection.get('name')
    }
  };
}
async function getAllEntries(state, collection) {
  const backend = (0, _backend.currentBackend)(state.config);
  const integration = (0, _reducers.selectIntegration)(state, collection.get('name'), 'listEntries');
  const provider = integration ? (0, _integrations.getIntegrationProvider)(state.integrations, backend.getToken, integration) : backend;
  const entries = await provider.listAllEntries(collection);
  return entries;
}
function sortByField(collection, key, direction = _redux.SortDirection.Ascending) {
  return async (dispatch, getState) => {
    const state = getState();
    // if we're already fetching we update the sort key, but skip loading entries
    const isFetching = (0, _entries.selectIsFetching)(state.entries, collection.get('name'));
    dispatch({
      type: SORT_ENTRIES_REQUEST,
      payload: {
        collection: collection.get('name'),
        key,
        direction
      }
    });
    if (isFetching) {
      return;
    }
    try {
      const entries = await getAllEntries(state, collection);
      dispatch({
        type: SORT_ENTRIES_SUCCESS,
        payload: {
          collection: collection.get('name'),
          key,
          direction,
          entries
        }
      });
    } catch (error) {
      dispatch({
        type: SORT_ENTRIES_FAILURE,
        payload: {
          collection: collection.get('name'),
          key,
          direction,
          error
        }
      });
    }
  };
}
function filterByField(collection, filter) {
  return async (dispatch, getState) => {
    const state = getState();
    // if we're already fetching we update the filter key, but skip loading entries
    const isFetching = (0, _entries.selectIsFetching)(state.entries, collection.get('name'));
    dispatch({
      type: FILTER_ENTRIES_REQUEST,
      payload: {
        collection: collection.get('name'),
        filter
      }
    });
    if (isFetching) {
      return;
    }
    try {
      const entries = await getAllEntries(state, collection);
      dispatch({
        type: FILTER_ENTRIES_SUCCESS,
        payload: {
          collection: collection.get('name'),
          filter,
          entries
        }
      });
    } catch (error) {
      dispatch({
        type: FILTER_ENTRIES_FAILURE,
        payload: {
          collection: collection.get('name'),
          filter,
          error
        }
      });
    }
  };
}
function groupByField(collection, group) {
  return async (dispatch, getState) => {
    const state = getState();
    const isFetching = (0, _entries.selectIsFetching)(state.entries, collection.get('name'));
    dispatch({
      type: GROUP_ENTRIES_REQUEST,
      payload: {
        collection: collection.get('name'),
        group
      }
    });
    if (isFetching) {
      return;
    }
    try {
      const entries = await getAllEntries(state, collection);
      dispatch({
        type: GROUP_ENTRIES_SUCCESS,
        payload: {
          collection: collection.get('name'),
          group,
          entries
        }
      });
    } catch (error) {
      dispatch({
        type: GROUP_ENTRIES_FAILURE,
        payload: {
          collection: collection.get('name'),
          group,
          error
        }
      });
    }
  };
}
function changeViewStyle(viewStyle) {
  return {
    type: CHANGE_VIEW_STYLE,
    payload: {
      style: viewStyle
    }
  };
}
function entryPersisting(collection, entry) {
  return {
    type: ENTRY_PERSIST_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug')
    }
  };
}
function entryPersisted(collection, entry, slug) {
  return {
    type: ENTRY_PERSIST_SUCCESS,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
      /**
       * Pass slug from backend for newly created entries.
       */
      slug
    }
  };
}
function entryPersistFail(collection, entry, error) {
  return {
    type: ENTRY_PERSIST_FAILURE,
    error: 'Failed to persist entry',
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
      error: error.toString()
    }
  };
}
function entryDeleting(collection, slug) {
  return {
    type: ENTRY_DELETE_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug
    }
  };
}
function entryDeleted(collection, slug) {
  return {
    type: ENTRY_DELETE_SUCCESS,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug
    }
  };
}
function entryDeleteFail(collection, slug, error) {
  return {
    type: ENTRY_DELETE_FAILURE,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
      error: error.toString()
    }
  };
}
function emptyDraftCreated(entry) {
  return {
    type: DRAFT_CREATE_EMPTY,
    payload: entry
  };
}
/*
 * Exported simple Action Creators
 */
function createDraftFromEntry(entry) {
  return {
    type: DRAFT_CREATE_FROM_ENTRY,
    payload: {
      entry
    }
  };
}
function draftDuplicateEntry(entry) {
  return {
    type: DRAFT_CREATE_DUPLICATE_FROM_ENTRY,
    payload: (0, _Entry.createEntry)(entry.get('collection'), '', '', {
      data: entry.get('data'),
      mediaFiles: entry.get('mediaFiles').toJS()
    })
  };
}
function discardDraft() {
  return {
    type: DRAFT_DISCARD
  };
}
function changeDraftField({
  field,
  value,
  metadata,
  entries,
  i18n
}) {
  return {
    type: DRAFT_CHANGE_FIELD,
    payload: {
      field,
      value,
      metadata,
      entries,
      i18n
    }
  };
}
function changeDraftFieldValidation(uniquefieldId, errors) {
  return {
    type: DRAFT_VALIDATION_ERRORS,
    payload: {
      uniquefieldId,
      errors
    }
  };
}
function clearFieldErrors() {
  return {
    type: DRAFT_CLEAR_ERRORS
  };
}
function localBackupRetrieved(entry) {
  return {
    type: DRAFT_LOCAL_BACKUP_RETRIEVED,
    payload: {
      entry
    }
  };
}
function loadLocalBackup() {
  return {
    type: DRAFT_CREATE_FROM_LOCAL_BACKUP
  };
}
function addDraftEntryMediaFile(file) {
  return {
    type: ADD_DRAFT_ENTRY_MEDIA_FILE,
    payload: file
  };
}
function removeDraftEntryMediaFile({
  id
}) {
  return {
    type: REMOVE_DRAFT_ENTRY_MEDIA_FILE,
    payload: {
      id
    }
  };
}
function persistLocalBackup(entry, collection) {
  return (_dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    return backend.persistLocalDraftBackup(entry, collection);
  };
}
function createDraftDuplicateFromEntry(entry) {
  return dispatch => {
    dispatch((0, _waitUntil.waitUntil)({
      predicate: ({
        type
      }) => type === DRAFT_CREATE_EMPTY,
      run: () => dispatch(draftDuplicateEntry(entry))
    }));
  };
}
function retrieveLocalBackup(collection, slug) {
  return async (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    const {
      entry
    } = await backend.getLocalDraftBackup(collection, slug);
    if (entry) {
      // load assets from backup
      const mediaFiles = entry.mediaFiles || [];
      const assetProxies = await Promise.all(mediaFiles.map(file => {
        if (file.file || file.url) {
          return (0, _AssetProxy.createAssetProxy)({
            path: file.path,
            file: file.file,
            url: file.url,
            field: file.field
          });
        } else {
          return (0, _media.getAsset)({
            collection,
            entry: (0, _immutable.fromJS)(entry),
            path: file.path,
            field: file.field
          })(dispatch, getState);
        }
      }));
      dispatch((0, _media.addAssets)(assetProxies));
      return dispatch(localBackupRetrieved(entry));
    }
  };
}
function deleteLocalBackup(collection, slug) {
  return (_dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    return backend.deleteLocalDraftBackup(collection, slug);
  };
}

/*
 * Exported Thunk Action Creators
 */

function loadEntry(collection, slug) {
  return async (dispatch, getState) => {
    await (0, _mediaLibrary.waitForMediaLibraryToLoad)(dispatch, getState());
    dispatch(entryLoading(collection, slug));
    try {
      const loadedEntry = await tryLoadEntry(getState(), collection, slug);
      dispatch(entryLoaded(collection, loadedEntry));
      dispatch(createDraftFromEntry(loadedEntry));
    } catch (error) {
      dispatch((0, _notifications.addNotification)({
        message: {
          details: error.message,
          key: 'ui.toast.onFailToLoadEntries'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(entryLoadError(error, collection, slug));
    }
  };
}
async function tryLoadEntry(state, collection, slug) {
  const backend = (0, _backend.currentBackend)(state.config);
  const loadedEntry = await backend.getEntry(state, collection, slug);
  return loadedEntry;
}
const appendActions = (0, _immutable.fromJS)({
  ['append_next']: {
    action: 'next',
    append: true
  }
});
function addAppendActionsToCursor(cursor) {
  return _decapCmsLibUtil.Cursor.create(cursor).updateStore('actions', actions => {
    return actions.union(appendActions.filter(v => actions.has(v.get('action'))).keySeq());
  });
}
function loadEntries(collection, page = 0) {
  return async (dispatch, getState) => {
    if (collection.get('isFetching')) {
      return;
    }
    const state = getState();
    const sortFields = (0, _entries.selectEntriesSortFields)(state.entries, collection.get('name'));
    if (sortFields && sortFields.length > 0) {
      const field = sortFields[0];
      return dispatch(sortByField(collection, field.get('key'), field.get('direction')));
    }
    const backend = (0, _backend.currentBackend)(state.config);
    const integration = (0, _reducers.selectIntegration)(state, collection.get('name'), 'listEntries');
    const provider = integration ? (0, _integrations.getIntegrationProvider)(state.integrations, backend.getToken, integration) : backend;
    const append = !!(page && !isNaN(page) && page > 0);
    dispatch(entriesLoading(collection));
    try {
      const loadAllEntries = collection.has('nested') || (0, _i18n.hasI18n)(collection);
      let response = await (loadAllEntries ?
      // nested collections require all entries to construct the tree
      provider.listAllEntries(collection).then(entries => ({
        entries
      })) : provider.listEntries(collection, page));
      response = _objectSpread(_objectSpread({}, response), {}, {
        // The only existing backend using the pagination system is the
        // Algolia integration, which is also the only integration used
        // to list entries. Thus, this checking for an integration can
        // determine whether or not this is using the old integer-based
        // pagination API. Other backends will simply store an empty
        // cursor, which behaves identically to no cursor at all.
        cursor: integration ? _decapCmsLibUtil.Cursor.create({
          actions: ['next'],
          meta: {
            usingOldPaginationAPI: true
          },
          data: {
            nextPage: page + 1
          }
        }) : _decapCmsLibUtil.Cursor.create(response.cursor)
      });
      dispatch(entriesLoaded(collection, response.cursor.meta.get('usingOldPaginationAPI') ? response.entries.reverse() : response.entries, response.pagination, addAppendActionsToCursor(response.cursor), append));
    } catch (err) {
      dispatch((0, _notifications.addNotification)({
        message: {
          details: err,
          key: 'ui.toast.onFailToLoadEntries'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      return Promise.reject(dispatch(entriesFailed(collection, err)));
    }
  };
}
function traverseCursor(backend, cursor, action) {
  if (!cursor.actions.has(action)) {
    throw new Error(`The current cursor does not support the pagination action "${action}".`);
  }
  return backend.traverseCursor(cursor, action);
}
function traverseCollectionCursor(collection, action) {
  return async (dispatch, getState) => {
    const state = getState();
    const collectionName = collection.get('name');
    if (state.entries.getIn(['pages', `${collectionName}`, 'isFetching'])) {
      return;
    }
    const backend = (0, _backend.currentBackend)(state.config);
    const {
      action: realAction,
      append
    } = appendActions.has(action) ? appendActions.get(action).toJS() : {
      action,
      append: false
    };
    const cursor = (0, _cursors.selectCollectionEntriesCursor)(state.cursors, collection.get('name'));

    // Handle cursors representing pages in the old, integer-based
    // pagination API
    if (cursor.meta.get('usingOldPaginationAPI', false)) {
      return dispatch(loadEntries(collection, cursor.data.get('nextPage')));
    }
    try {
      var _newCursor$meta;
      dispatch(entriesLoading(collection));
      const {
        entries,
        cursor: newCursor
      } = await traverseCursor(backend, cursor, realAction);
      const pagination = (_newCursor$meta = newCursor.meta) === null || _newCursor$meta === void 0 ? void 0 : _newCursor$meta.get('page');
      return dispatch(entriesLoaded(collection, entries, pagination, addAppendActionsToCursor(newCursor), append));
    } catch (err) {
      console.error(err);
      dispatch((0, _notifications.addNotification)({
        message: {
          details: err,
          key: 'ui.toast.onFailToLoadEntries'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      return Promise.reject(dispatch(entriesFailed(collection, err)));
    }
  };
}
function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function processValue(unsafe) {
  if (['true', 'True', 'TRUE'].includes(unsafe)) {
    return true;
  }
  if (['false', 'False', 'FALSE'].includes(unsafe)) {
    return false;
  }
  return escapeHtml(unsafe);
}
function getDataFields(fields) {
  return fields.filter(f => !f.get('meta')).toList();
}
function getMetaFields(fields) {
  return fields.filter(f => f.get('meta') === true).toList();
}
function createEmptyDraft(collection, search) {
  return async (dispatch, getState) => {
    const params = new URLSearchParams(search);
    params.forEach((value, key) => {
      collection = (0, _collections.updateFieldByKey)(collection, key, field => field.set('default', processValue(value)));
    });
    const fields = collection.get('fields', (0, _immutable.List)());
    const dataFields = getDataFields(fields);
    const data = createEmptyDraftData(dataFields);
    const metaFields = getMetaFields(fields);
    const meta = createEmptyDraftData(metaFields);
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    if (!collection.has('media_folder')) {
      await (0, _mediaLibrary.waitForMediaLibraryToLoad)(dispatch, getState());
    }
    const i18nFields = createEmptyDraftI18nData(collection, dataFields);
    let newEntry = (0, _Entry.createEntry)(collection.get('name'), '', '', {
      data,
      i18n: i18nFields,
      mediaFiles: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta: meta
    });
    newEntry = await backend.processEntry(state, collection, newEntry);
    dispatch(emptyDraftCreated(newEntry));
  };
}
function createEmptyDraftData(fields, skipField = () => false) {
  return fields.reduce((reduction, value) => {
    const acc = reduction;
    const item = value;
    if (skipField(item)) {
      return acc;
    }
    const subfields = item.get('field') || item.get('fields');
    const list = item.get('widget') == 'list';
    const name = item.get('name');
    const defaultValue = item.get('default', null);
    function isEmptyDefaultValue(val) {
      return [[{}], {}].some(e => (0, _isEqual2.default)(val, e));
    }
    const hasSubfields = _immutable.List.isList(subfields) || _immutable.Map.isMap(subfields);
    if (hasSubfields) {
      if (list && _immutable.List.isList(defaultValue)) {
        acc[name] = defaultValue;
      } else {
        const asList = _immutable.List.isList(subfields) ? subfields : (0, _immutable.List)([subfields]);
        const subDefaultValue = list ? [createEmptyDraftData(asList, skipField)] : createEmptyDraftData(asList, skipField);
        if (!isEmptyDefaultValue(subDefaultValue)) {
          acc[name] = subDefaultValue;
        }
      }
      return acc;
    }
    if (defaultValue !== null) {
      acc[name] = defaultValue;
    }
    return acc;
  }, {});
}
function createEmptyDraftI18nData(collection, dataFields) {
  if (!(0, _i18n.hasI18n)(collection)) {
    return {};
  }
  function skipField(field) {
    return field.get(_i18n.I18N) !== _i18n.I18N_FIELD.DUPLICATE && field.get(_i18n.I18N) !== _i18n.I18N_FIELD.TRANSLATE;
  }
  const i18nData = createEmptyDraftData(dataFields, skipField);
  return (0, _i18n.duplicateDefaultI18nFields)(collection, i18nData);
}
function getMediaAssets({
  entry
}) {
  const filesArray = entry.get('mediaFiles').toArray();
  const assets = filesArray.filter(file => file.get('draft')).map(file => (0, _AssetProxy.createAssetProxy)({
    path: file.get('path'),
    file: file.get('file'),
    url: file.get('url'),
    field: file.get('field')
  }));
  return assets;
}
function getSerializedEntry(collection, entry) {
  /**
   * Serialize the values of any fields with registered serializers, and
   * update the entry and entryDraft with the serialized values.
   */
  const fields = (0, _collections.selectFields)(collection, entry.get('slug'));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function serializeData(data) {
    return (0, _serializeEntryValues.serializeValues)(data, fields);
  }
  const serializedData = serializeData(entry.get('data'));
  let serializedEntry = entry.set('data', serializedData);
  if ((0, _i18n.hasI18n)(collection)) {
    serializedEntry = (0, _i18n.serializeI18n)(collection, serializedEntry, serializeData);
  }
  return serializedEntry;
}
function persistEntry(collection) {
  return async (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');
    const usedSlugs = (0, _reducers.selectPublishedSlugs)(state, collection.get('name'));

    // Early return if draft contains validation errors
    if (!fieldsErrors.isEmpty()) {
      const hasPresenceErrors = fieldsErrors.some(errors => errors.some(error => error.type && error.type === _validationErrorTypes.default.PRESENCE));
      if (hasPresenceErrors) {
        dispatch((0, _notifications.addNotification)({
          message: {
            key: 'ui.toast.missingRequiredField'
          },
          type: 'error',
          dismissAfter: 8000
        }));
      }
      return Promise.reject();
    }
    const backend = (0, _backend.currentBackend)(state.config);
    const entry = entryDraft.get('entry');
    const assetProxies = getMediaAssets({
      entry
    });
    const serializedEntry = getSerializedEntry(collection, entry);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);
    dispatch(entryPersisting(collection, serializedEntry));
    return backend.persistEntry({
      config: state.config,
      collection,
      entryDraft: serializedEntryDraft,
      assetProxies,
      usedSlugs
    }).then(async newSlug => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.entrySaved'
        },
        type: 'success',
        dismissAfter: 4000
      }));

      // re-load media library if entry had media files
      if (assetProxies.length > 0) {
        await dispatch((0, _mediaLibrary.loadMedia)());
      }
      dispatch(entryPersisted(collection, serializedEntry, newSlug));
      if (collection.has('nested')) {
        await dispatch(loadEntries(collection));
      }
      if (entry.get('slug') !== newSlug) {
        await dispatch(loadEntry(collection, newSlug));
        (0, _history.navigateToEntry)(collection.get('name'), newSlug);
      }
    }).catch(error => {
      console.error(error);
      dispatch((0, _notifications.addNotification)({
        message: {
          details: error,
          key: 'ui.toast.onFailToPersist'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      return Promise.reject(dispatch(entryPersistFail(collection, serializedEntry, error)));
    });
  };
}
function deleteEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    dispatch(entryDeleting(collection, slug));
    return backend.deleteEntry(state, collection, slug).then(() => {
      return dispatch(entryDeleted(collection, slug));
    }).catch(error => {
      dispatch((0, _notifications.addNotification)({
        message: {
          details: error,
          key: 'ui.toast.onFailToDelete'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      console.error(error);
      return Promise.reject(dispatch(entryDeleteFail(collection, slug, error)));
    });
  };
}
function getPathError(path, key, t) {
  return {
    error: {
      type: _validationErrorTypes.default.CUSTOM,
      message: t(`editor.editorControlPane.widget.${key}`, {
        path
      })
    }
  };
}
function validateMetaField(state, collection, field, value, t) {
  if (field.get('meta') && field.get('name') === 'path') {
    var _state$entryDraft;
    if (!value) {
      return getPathError(value, 'invalidPath', t);
    }
    const sanitizedPath = value.split('/').map((0, _formatters.getProcessSegment)(state.config.slug)).join('/');
    if (value !== sanitizedPath) {
      return getPathError(value, 'invalidPath', t);
    }
    const customPath = (0, _entryDraft.selectCustomPath)(collection, (0, _immutable.fromJS)({
      entry: {
        meta: {
          path: value
        }
      }
    }));
    const existingEntry = customPath ? (0, _entries.selectEntryByPath)(state.entries, collection.get('name'), customPath) : undefined;
    const existingEntryPath = existingEntry === null || existingEntry === void 0 ? void 0 : existingEntry.get('path');
    const draftPath = (_state$entryDraft = state.entryDraft) === null || _state$entryDraft === void 0 ? void 0 : _state$entryDraft.getIn(['entry', 'path']);
    if (existingEntryPath && existingEntryPath !== draftPath) {
      return getPathError(value, 'pathExists', t);
    }
  }
  return {
    error: false
  };
}