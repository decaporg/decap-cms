"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNPUBLISHED_ENTRY_SUCCESS = exports.UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = exports.UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = exports.UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = exports.UNPUBLISHED_ENTRY_REQUEST = exports.UNPUBLISHED_ENTRY_REDIRECT = exports.UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = exports.UNPUBLISHED_ENTRY_PUBLISH_REQUEST = exports.UNPUBLISHED_ENTRY_PUBLISH_FAILURE = exports.UNPUBLISHED_ENTRY_PERSIST_SUCCESS = exports.UNPUBLISHED_ENTRY_PERSIST_REQUEST = exports.UNPUBLISHED_ENTRY_PERSIST_FAILURE = exports.UNPUBLISHED_ENTRY_DELETE_SUCCESS = exports.UNPUBLISHED_ENTRY_DELETE_REQUEST = exports.UNPUBLISHED_ENTRY_DELETE_FAILURE = exports.UNPUBLISHED_ENTRIES_SUCCESS = exports.UNPUBLISHED_ENTRIES_REQUEST = exports.UNPUBLISHED_ENTRIES_FAILURE = void 0;
exports.deleteUnpublishedEntry = deleteUnpublishedEntry;
exports.loadUnpublishedEntries = loadUnpublishedEntries;
exports.loadUnpublishedEntry = loadUnpublishedEntry;
exports.persistUnpublishedEntry = persistUnpublishedEntry;
exports.publishUnpublishedEntry = publishUnpublishedEntry;
exports.unpublishPublishedEntry = unpublishPublishedEntry;
exports.updateUnpublishedEntryStatus = updateUnpublishedEntryStatus;
var _get2 = _interopRequireDefault(require("lodash/get"));
var _immutable = require("immutable");
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _backend = require("../backend");
var _reducers = require("../reducers");
var _entries = require("../reducers/entries");
var _publishModes = require("../constants/publishModes");
var _entries2 = require("./entries");
var _AssetProxy = require("../valueObjects/AssetProxy");
var _media = require("./media");
var _mediaLibrary = require("./mediaLibrary");
var _validationErrorTypes = _interopRequireDefault(require("../constants/validationErrorTypes"));
var _history = require("../routing/history");
var _notifications = require("./notifications");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Constant Declarations
 */
const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
exports.UNPUBLISHED_ENTRY_REQUEST = UNPUBLISHED_ENTRY_REQUEST;
const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
exports.UNPUBLISHED_ENTRY_SUCCESS = UNPUBLISHED_ENTRY_SUCCESS;
const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';
exports.UNPUBLISHED_ENTRY_REDIRECT = UNPUBLISHED_ENTRY_REDIRECT;
const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
exports.UNPUBLISHED_ENTRIES_REQUEST = UNPUBLISHED_ENTRIES_REQUEST;
const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
exports.UNPUBLISHED_ENTRIES_SUCCESS = UNPUBLISHED_ENTRIES_SUCCESS;
const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';
exports.UNPUBLISHED_ENTRIES_FAILURE = UNPUBLISHED_ENTRIES_FAILURE;
const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
exports.UNPUBLISHED_ENTRY_PERSIST_REQUEST = UNPUBLISHED_ENTRY_PERSIST_REQUEST;
const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';
exports.UNPUBLISHED_ENTRY_PERSIST_SUCCESS = UNPUBLISHED_ENTRY_PERSIST_SUCCESS;
const UNPUBLISHED_ENTRY_PERSIST_FAILURE = 'UNPUBLISHED_ENTRY_PERSIST_FAILURE';
exports.UNPUBLISHED_ENTRY_PERSIST_FAILURE = UNPUBLISHED_ENTRY_PERSIST_FAILURE;
const UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST';
exports.UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST;
const UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS';
exports.UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS;
const UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE';
exports.UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE;
const UNPUBLISHED_ENTRY_PUBLISH_REQUEST = 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST';
exports.UNPUBLISHED_ENTRY_PUBLISH_REQUEST = UNPUBLISHED_ENTRY_PUBLISH_REQUEST;
const UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS';
exports.UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = UNPUBLISHED_ENTRY_PUBLISH_SUCCESS;
const UNPUBLISHED_ENTRY_PUBLISH_FAILURE = 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE';
exports.UNPUBLISHED_ENTRY_PUBLISH_FAILURE = UNPUBLISHED_ENTRY_PUBLISH_FAILURE;
const UNPUBLISHED_ENTRY_DELETE_REQUEST = 'UNPUBLISHED_ENTRY_DELETE_REQUEST';
exports.UNPUBLISHED_ENTRY_DELETE_REQUEST = UNPUBLISHED_ENTRY_DELETE_REQUEST;
const UNPUBLISHED_ENTRY_DELETE_SUCCESS = 'UNPUBLISHED_ENTRY_DELETE_SUCCESS';
exports.UNPUBLISHED_ENTRY_DELETE_SUCCESS = UNPUBLISHED_ENTRY_DELETE_SUCCESS;
const UNPUBLISHED_ENTRY_DELETE_FAILURE = 'UNPUBLISHED_ENTRY_DELETE_FAILURE';

/*
 * Simple Action Creators (Internal)
 */
exports.UNPUBLISHED_ENTRY_DELETE_FAILURE = UNPUBLISHED_ENTRY_DELETE_FAILURE;
function unpublishedEntryLoading(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug
    }
  };
}
function unpublishedEntryLoaded(collection, entry) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry
    }
  };
}
function unpublishedEntryRedirected(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REDIRECT,
    payload: {
      collection: collection.get('name'),
      slug
    }
  };
}
function unpublishedEntriesLoading() {
  return {
    type: UNPUBLISHED_ENTRIES_REQUEST
  };
}
function unpublishedEntriesLoaded(entries, pagination) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination
    }
  };
}
function unpublishedEntriesFailed(error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error
  };
}
function unpublishedEntryPersisting(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug
    }
  };
}
function unpublishedEntryPersisted(collection, entry) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry
    }
  };
}
function unpublishedEntryPersistedFail(error, collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug
    },
    error
  };
}
function unpublishedEntryStatusChangeRequest(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryStatusChangePersisted(collection, slug, newStatus) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: {
      collection,
      slug,
      newStatus
    }
  };
}
function unpublishedEntryStatusChangeError(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryPublishRequest(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryPublished(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryPublishError(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryDeleteRequest(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_REQUEST,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryDeleted(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_SUCCESS,
    payload: {
      collection,
      slug
    }
  };
}
function unpublishedEntryDeleteError(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_FAILURE,
    payload: {
      collection,
      slug
    }
  };
}

/*
 * Exported Thunk Action Creators
 */

function loadUnpublishedEntry(collection, slug) {
  return async (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    const entriesLoaded = (0, _get2.default)(state.editorialWorkflow.toJS(), 'pages.ids', false);
    //run possible unpublishedEntries migration
    if (!entriesLoaded) {
      try {
        const {
          entries,
          pagination
        } = await backend.unpublishedEntries(state.collections);
        dispatch(unpublishedEntriesLoaded(entries, pagination));
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    dispatch(unpublishedEntryLoading(collection, slug));
    try {
      const entry = await backend.unpublishedEntry(state, collection, slug);
      const assetProxies = await Promise.all(entry.mediaFiles.filter(file => file.draft).map(({
        url,
        file,
        path
      }) => (0, _AssetProxy.createAssetProxy)({
        path,
        url,
        file
      })));
      dispatch((0, _media.addAssets)(assetProxies));
      dispatch(unpublishedEntryLoaded(collection, entry));
      dispatch((0, _entries2.createDraftFromEntry)(entry));
    } catch (error) {
      if (error.name === _decapCmsLibUtil.EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch((0, _entries2.loadEntry)(collection, slug));
      } else {
        dispatch((0, _notifications.addNotification)({
          message: {
            key: 'ui.toast.onFailToLoadEntries',
            details: error
          },
          type: 'error',
          dismissAfter: 8000
        }));
      }
    }
  };
}
function loadUnpublishedEntries(collections) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    const entriesLoaded = (0, _get2.default)(state.editorialWorkflow.toJS(), 'pages.ids', false);
    if (state.config.publish_mode !== _publishModes.EDITORIAL_WORKFLOW || entriesLoaded) {
      return;
    }
    dispatch(unpublishedEntriesLoading());
    backend.unpublishedEntries(collections).then(response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination))).catch(error => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onFailToLoadEntries',
          details: error
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(unpublishedEntriesFailed(error));
      Promise.reject(error);
    });
  };
}
function persistUnpublishedEntry(collection, existingUnpublishedEntry) {
  return async (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');
    const unpublishedSlugs = (0, _reducers.selectUnpublishedSlugs)(state, collection.get('name'));
    const publishedSlugs = (0, _reducers.selectPublishedSlugs)(state, collection.get('name'));
    const usedSlugs = publishedSlugs.concat(unpublishedSlugs);
    const entriesLoaded = (0, _get2.default)(state.editorialWorkflow.toJS(), 'pages.ids', false);

    //load unpublishedEntries
    !entriesLoaded && dispatch(loadUnpublishedEntries(state.collections));

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
    const assetProxies = (0, _entries2.getMediaAssets)({
      entry
    });
    const serializedEntry = (0, _entries2.getSerializedEntry)(collection, entry);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);
    dispatch(unpublishedEntryPersisting(collection, entry.get('slug')));
    const persistAction = existingUnpublishedEntry ? backend.persistUnpublishedEntry : backend.persistEntry;
    try {
      const newSlug = await persistAction.call(backend, {
        config: state.config,
        collection,
        entryDraft: serializedEntryDraft,
        assetProxies,
        usedSlugs
      });
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.entrySaved'
        },
        type: 'success',
        dismissAfter: 4000
      }));
      dispatch(unpublishedEntryPersisted(collection, serializedEntry));
      if (entry.get('slug') !== newSlug) {
        dispatch(loadUnpublishedEntry(collection, newSlug));
        (0, _history.navigateToEntry)(collection.get('name'), newSlug);
      }
    } catch (error) {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onFailToPersist',
          details: error
        },
        type: 'error',
        dismissAfter: 8000
      }));
      return Promise.reject(dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug'))));
    }
  };
}
function updateUnpublishedEntryStatus(collection, slug, oldStatus, newStatus) {
  return (dispatch, getState) => {
    if (oldStatus === newStatus) return;
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    dispatch(unpublishedEntryStatusChangeRequest(collection, slug));
    backend.updateUnpublishedEntryStatus(collection, slug, newStatus).then(() => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.entryUpdated'
        },
        type: 'success',
        dismissAfter: 4000
      }));
      dispatch(unpublishedEntryStatusChangePersisted(collection, slug, newStatus));
    }).catch(error => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onFailToUpdateStatus',
          details: error
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(unpublishedEntryStatusChangeError(collection, slug));
    });
  };
}
function deleteUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    dispatch(unpublishedEntryDeleteRequest(collection, slug));
    return backend.deleteUnpublishedEntry(collection, slug).then(() => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onDeleteUnpublishedChanges'
        },
        type: 'success',
        dismissAfter: 4000
      }));
      dispatch(unpublishedEntryDeleted(collection, slug));
    }).catch(error => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onDeleteUnpublishedChanges',
          details: error
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(unpublishedEntryDeleteError(collection, slug));
    });
  };
}
function publishUnpublishedEntry(collectionName, slug) {
  return async (dispatch, getState) => {
    const state = getState();
    const collections = state.collections;
    const backend = (0, _backend.currentBackend)(state.config);
    const entry = (0, _reducers.selectUnpublishedEntry)(state, collectionName, slug);
    dispatch(unpublishedEntryPublishRequest(collectionName, slug));
    try {
      await backend.publishUnpublishedEntry(entry);
      // re-load media after entry was published
      dispatch((0, _mediaLibrary.loadMedia)());
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.entryPublished'
        },
        type: 'success',
        dismissAfter: 4000
      }));
      dispatch(unpublishedEntryPublished(collectionName, slug));
      const collection = collections.get(collectionName);
      if (collection.has('nested')) {
        dispatch((0, _entries2.loadEntries)(collection));
        const newSlug = (0, _backend.slugFromCustomPath)(collection, entry.get('path'));
        (0, _entries2.loadEntry)(collection, newSlug);
        if (slug !== newSlug && (0, _entries.selectEditingDraft)(state.entryDraft)) {
          (0, _history.navigateToEntry)(collection.get('name'), newSlug);
        }
      } else {
        return dispatch((0, _entries2.loadEntry)(collection, slug));
      }
    } catch (error) {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onFailToPublishEntry',
          details: error
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(unpublishedEntryPublishError(collectionName, slug));
    }
  };
}
function unpublishPublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    const entry = (0, _reducers.selectEntry)(state, collection.get('name'), slug);
    const entryDraft = (0, _immutable.Map)().set('entry', entry);
    dispatch(unpublishedEntryPersisting(collection, slug));
    return backend.deleteEntry(state, collection, slug).then(() => backend.persistEntry({
      config: state.config,
      collection,
      entryDraft,
      assetProxies: [],
      usedSlugs: (0, _immutable.List)(),
      status: _publishModes.status.get('PENDING_PUBLISH')
    })).then(() => {
      dispatch(unpublishedEntryPersisted(collection, entry));
      dispatch((0, _entries2.entryDeleted)(collection, slug));
      dispatch(loadUnpublishedEntry(collection, slug));
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.entryUnpublished'
        },
        type: 'success',
        dismissAfter: 4000
      }));
    }).catch(error => {
      dispatch((0, _notifications.addNotification)({
        message: {
          key: 'ui.toast.onFailToUnpublishEntry',
          details: error
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug')));
    });
  };
}