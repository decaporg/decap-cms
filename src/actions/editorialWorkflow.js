import uuid from 'uuid';
import { actions as notifActions } from 'redux-notifications';
import { closeEntry } from './editor';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { currentBackend } from '../backends/backend';
import { getAsset } from '../reducers';
import { loadEntry } from './entries';
import { status, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import { EditorialWorkflowError } from "../valueObjects/errors";

const { notifSend } = notifActions;

/*
 * Contant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
export const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

export const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
export const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';
export const UNPUBLISHED_ENTRY_PERSIST_FAILURE = 'UNPUBLISHED_ENTRY_PERSIST_FAILURE';

export const UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE';

export const UNPUBLISHED_ENTRY_PUBLISH_REQUEST = 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST';
export const UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS';
export const UNPUBLISHED_ENTRY_PUBLISH_FAILURE = 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE';

/*
 * Simple Action Creators (Internal)
 */

function unpublishedEntryLoading(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryLoaded(collection, entry) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: { 
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryRedirected(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REDIRECT,
    payload: { 
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntriesLoading() {
  return {
    type: UNPUBLISHED_ENTRIES_REQUEST,
  };
}

function unpublishedEntriesLoaded(entries, pagination) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination,
    },
  };
}

function unpublishedEntriesFailed(error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error,
  };
}


function unpublishedEntryPersisting(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPersisted(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: { 
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPersistedFail(error, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: { error },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: { 
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryStatusChangePersisted(collection, slug, oldStatus, newStatus, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: { 
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryStatusChangeError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryPublishRequest(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: { collection, slug },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPublished(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: { collection, slug },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPublishError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryLoading(collection, slug));
    backend.unpublishedEntry(collection, slug)
    .then(entry => dispatch(unpublishedEntryLoaded(collection, entry)))
    .catch((error) => {
      if (error instanceof EditorialWorkflowError && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(notifSend({
          message: `Error loading entry: ${ error }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
      }
    });
  };
}

export function loadUnpublishedEntries() {
  return (dispatch, getState) => {
    const state = getState();
    if (state.config.get('publish_mode') !== EDITORIAL_WORKFLOW) return;
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntriesLoading());
    backend.unpublishedEntries().then(
      response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)),
      error => dispatch(unpublishedEntriesFailed(error))
    );
  };
}

export function persistUnpublishedEntry(collection, existingUnpublishedEntry) {
  return (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;

    // Early return if draft contains validation errors
    if (!entryDraft.get('fieldsErrors').isEmpty()) return Promise.reject();

    const backend = currentBackend(state.config);
    const assetProxies = entryDraft.get('mediaFiles').map(path => getAsset(state, path));
    const entry = entryDraft.get('entry');
    const transactionID = uuid.v4();

    dispatch(unpublishedEntryPersisting(collection, entry, transactionID));
    const persistAction = existingUnpublishedEntry ? backend.persistUnpublishedEntry : backend.persistEntry;
    return persistAction.call(backend, state.config, collection, entryDraft, assetProxies.toJS())
    .then(() => {
      dispatch(notifSend({
        message: 'Entry saved',
        kind: 'success',
        dismissAfter: 4000,
      }));
      return dispatch(unpublishedEntryPersisted(collection, entry, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to persist entry: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      return dispatch(unpublishedEntryPersistedFail(error, transactionID));
    });
  };
}

export function updateUnpublishedEntryStatus(collection, slug, oldStatus, newStatus) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid.v4();
    dispatch(unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID));
    backend.updateUnpublishedEntryStatus(collection, slug, newStatus)
    .then(() => {
      dispatch(unpublishedEntryStatusChangePersisted(collection, slug, oldStatus, newStatus, transactionID));
    })
    .catch(() => {
      dispatch(unpublishedEntryStatusChangeError(collection, slug, transactionID));
    });
  };
}

export function deleteUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid.v4();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID)); 
    return backend.deleteUnpublishedEntry(collection, slug)
    .then(() => {
      return dispatch(unpublishedEntryPublished(collection, slug, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to close PR: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      return dispatch(unpublishedEntryPublishError(collection, slug, transactionID)); 
    })
  };
}

export function publishUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid.v4();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID));
    return backend.publishUnpublishedEntry(collection, slug)
    .then(() => {
      return dispatch(unpublishedEntryPublished(collection, slug, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to merge: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      return dispatch(unpublishedEntryPublishError(collection, slug, transactionID));
    });
  };
}
