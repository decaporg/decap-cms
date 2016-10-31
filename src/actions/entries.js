import { actions as notifActions } from 'redux-notifications';
import { currentBackend } from '../backends/backend';
import { getIntegrationProvider } from '../integrations';
import { getMedia, selectIntegration } from '../reducers';

const { notifSend } = notifActions;

/*
 * Contant Declarations
 */
export const ENTRY_REQUEST = 'ENTRY_REQUEST';
export const ENTRY_SUCCESS = 'ENTRY_SUCCESS';
export const ENTRY_FAILURE = 'ENTRY_FAILURE';

export const ENTRIES_REQUEST = 'ENTRIES_REQUEST';
export const ENTRIES_SUCCESS = 'ENTRIES_SUCCESS';
export const ENTRIES_FAILURE = 'ENTRIES_FAILURE';

export const DRAFT_CREATE_FROM_ENTRY = 'DRAFT_CREATE_FROM_ENTRY';
export const DRAFT_CREATE_EMPTY = 'DRAFT_CREATE_EMPTY';
export const DRAFT_DISCARD = 'DRAFT_DISCARD';
export const DRAFT_CHANGE = 'DRAFT_CHANGE';

export const ENTRY_PERSIST_REQUEST = 'ENTRY_PERSIST_REQUEST';
export const ENTRY_PERSIST_SUCCESS = 'ENTRY_PERSIST_SUCCESS';
export const ENTRY_PERSIST_FAILURE = 'ENTRY_PERSIST_FAILURE';

export const SEARCH_ENTRIES_REQUEST = 'SEARCH_ENTRIES_REQUEST';
export const SEARCH_ENTRIES_SUCCESS = 'SEARCH_ENTRIES_SUCCESS';
export const SEARCH_ENTRIES_FAILURE = 'SEARCH_ENTRIES_FAILURE';

/*
 * Simple Action Creators (Internal)
 * We still need to export them for tests
 */
export function entryLoading(collection, slug) {
  return {
    type: ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

export function entryLoaded(collection, entry) {
  return {
    type: ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

export function entriesLoading(collection) {
  return {
    type: ENTRIES_REQUEST,
    payload: {
      collection: collection.get('name'),
    },
  };
}

export function entriesLoaded(collection, entries, pagination) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries,
      page: pagination,
    },
  };
}

export function entriesFailed(collection, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: { collection: collection.get('name') },
  };
}

export function entryPersisting(collection, entry) {
  return {
    type: ENTRY_PERSIST_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
    },
  };
}

export function entryPersisted(collection, entry) {
  return {
    type: ENTRY_PERSIST_SUCCESS,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
    },
  };
}

export function entryPersistFail(collection, entry, error) {
  return {
    type: ENTRY_PERSIST_FAILURE,
    error: 'Failed to persist entry',
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
      error: error.toString(),
    },
  };
}

export function emmptyDraftCreated(entry) {
  return {
    type: DRAFT_CREATE_EMPTY,
    payload: entry,
  };
}

export function searchingEntries(searchTerm) {
  return {
    type: SEARCH_ENTRIES_REQUEST,
    payload: { searchTerm },
  };
}

export function searchSuccess(searchTerm, entries, page) {
  return {
    type: SEARCH_ENTRIES_SUCCESS,
    payload: {
      searchTerm,
      entries,
      page,
    },
  };
}

export function searchFailure(searchTerm, error) {
  return {
    type: SEARCH_ENTRIES_FAILURE,
    payload: {
      searchTerm,
      error,
    },
  };
}

/*
 * Exported simple Action Creators
 */
export function createDraftFromEntry(entry) {
  return {
    type: DRAFT_CREATE_FROM_ENTRY,
    payload: entry,
  };
}

export function discardDraft() {
  return {
    type: DRAFT_DISCARD,
  };
}

export function changeDraft(entry) {
  return {
    type: DRAFT_CHANGE,
    payload: entry,
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadEntry(entry, collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(entryLoading(collection, slug));
    return backend.getEntry(collection, slug)
      .then(loadedEntry => (
        dispatch(entryLoaded(collection, loadedEntry))
      ));
  };
}

export function loadEntries(collection, page = 0) {
  return (dispatch, getState) => {
    if (collection.get('isFetching')) {
      return;
    }
    const state = getState();
    const integration = selectIntegration(state, collection.get('name'), 'listEntries');
    const provider = integration ? getIntegrationProvider(state.integrations, integration) : currentBackend(state.config);
    dispatch(entriesLoading(collection));
    provider.listEntries(collection, page).then(
      response => dispatch(entriesLoaded(collection, response.entries, response.pagination)),
      error => dispatch(entriesFailed(collection, error))
    );
  };
}

export function createEmptyDraft(collection) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const newEntry = backend.newEntry(collection);
    dispatch(emmptyDraftCreated(newEntry));
  };
}

export function persistEntry(collection, entryDraft) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const mediaProxies = entryDraft.get('mediaFiles').map(path => getMedia(state, path));
    const entry = entryDraft.get('entry');
    dispatch(entryPersisting(collection, entry));
    backend
      .persistEntry(state.config, collection, entryDraft, mediaProxies.toJS())
      .then(() => {
        dispatch(notifSend({
          message: 'Entry saved',
          kind: 'success',
          dismissAfter: 4000,
        }));
        dispatch(entryPersisted(collection, entry));
      })
      .catch((error) => {
        dispatch(notifSend({
          message: 'Failed to persist entry',
          kind: 'danger',
          dismissAfter: 4000,
        }));
        dispatch(entryPersistFail(collection, entry, error));
      });
  };
}

export function searchEntries(searchTerm, page = 0) {
  return (dispatch, getState) => {
    const state = getState();
    let collections = state.collections.keySeq().toArray();
    collections = collections.filter(collection => selectIntegration(state, collection, 'search'));
    const integration = selectIntegration(state, collections[0], 'search');
    if (!integration) {
      dispatch(searchFailure(searchTerm, 'Search integration is not configured.'));
    }
    const provider = integration ?
      getIntegrationProvider(state.integrations, integration)
      : currentBackend(state.config);
    dispatch(searchingEntries(searchTerm));
    provider.search(collections, searchTerm, page).then(
      response => dispatch(searchSuccess(searchTerm, response.entries, response.pagination)),
      error => dispatch(searchFailure(searchTerm, error))
    );
  };
}
