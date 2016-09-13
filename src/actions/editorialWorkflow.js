import { currentBackend } from '../backends/backend';
import { getMedia } from '../reducers';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
/*
 * Contant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

export const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
export const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';

/*
 * Simple Action Creators (Internal)
 */

function unpublishedEntryLoading(status, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: { status,  slug }
  };
}

function unpublishedEntryLoaded(status, entry) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: { status, entry }
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
      entries: entries,
      pages: pagination
    }
  };
}

function unpublishedEntriesFailed(error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
  };
}


function unpublishedEntryPersisting(status, entry) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: { status, entry }
  };
}

function unpublishedEntryPersisted(status, entry) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: { status, entry }
  };
}

function unpublishedEntryPersistedFail(status, entry) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: { status, entry }
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadUnpublishedEntry(collection, status, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryLoading(status, slug));
    backend.unpublishedEntry(collection, slug)
      .then((entry) => dispatch(unpublishedEntryLoaded(status, entry)));
  };
}

export function loadUnpublishedEntries() {
  return (dispatch, getState) => {
    const state = getState();
    if (state.config.get('publish_mode') !== EDITORIAL_WORKFLOW) return;
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntriesLoading());
    backend.unpublishedEntries().then(
      (response) => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)),
      (error) => dispatch(unpublishedEntriesFailed(error))
    );
  };
}

export function persistUnpublishedEntry(collection, status, entry) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const MediaProxies = entry && entry.get('mediaFiles').map(path => getMedia(state, path));
    dispatch(unpublishedEntryPersisting(status, entry));
    backend.persistUnpublishedEntry(state.config, collection, status, entry, MediaProxies.toJS()).then(
      () => {
        dispatch(unpublishedEntryPersisted(status, entry));
      },
      (error) => dispatch(unpublishedEntryPersistedFail(error))
    );
  };
}
