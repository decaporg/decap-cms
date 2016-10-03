import { currentBackend } from '../backends/backend';
import { currentSearchIntegration } from '../integrations/search';
import { getMedia, hasSearchIntegration, useSearchForListing } from '../reducers';

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
      slug: slug
    }
  };
}

export function entryLoaded(collection, entry) {
  return {
    type: ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry: entry
    }
  };
}

export function entriesLoading(collection) {
  return {
    type: ENTRIES_REQUEST,
    payload: {
      collection: collection.get('name')
    }
  };
}

export function entriesLoaded(collection, entries, pagination) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries: entries,
      page: pagination
    }
  };
}

export function entriesFailed(collection, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: { collection: collection.get('name') }
  };
}

export function entryPersisting(collection, entry) {
  return {
    type: ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection,
      entry: entry
    }
  };
}

export function entryPersisted(collection, entry) {
  return {
    type: ENTRY_PERSIST_SUCCESS,
    payload: {
      collection: collection,
      entry: entry
    }
  };
}

export function entryPersistFail(collection, entry, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to persist entry',
    payload: error.toString()
  };
}

export function emmptyDraftCreated(entry) {
  return {
    type: DRAFT_CREATE_EMPTY,
    payload: entry
  };
}

export function searchingEntries(searchTerm) {
  return {
    type: SEARCH_ENTRIES_REQUEST,
    payload: { searchTerm }
  };
}

export function SearchSuccess(searchTerm, entries, page) {
  return {
    type: SEARCH_ENTRIES_SUCCESS,
    payload: {
      searchTerm,
      entries,
      page
    }
  };
}

export function SearchFailure(searchTerm, error) {
  return {
    type: SEARCH_ENTRIES_FAILURE,
    payload: {
      searchTerm,
      error
    }
  };
}

/*
 * Exported simple Action Creators
 */
export function createDraftFromEntry(entry) {
  return {
    type: DRAFT_CREATE_FROM_ENTRY,
    payload: entry
  };
}

export function discardDraft() {
  return {
    type: DRAFT_DISCARD
  };
}

export function changeDraft(entry) {
  return {
    type: DRAFT_CHANGE,
    payload: entry
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

    let returnPromise;
    if (hasSearchIntegration(state) && useSearchForListing(state)) {
      const search = currentSearchIntegration(state.config);
      const loadEntriesPromise = entry ? Promise.resolve(entry.toJS()) : search.entry(collection, slug);
      returnPromise = loadEntriesPromise
        .then(loadedEntry => backend.getEntry(loadedEntry.collection, loadedEntry.slug, loadedEntry.path));
    } else {
      returnPromise = backend.entry(collection, slug);
    }

    return returnPromise.then((loadedEntry) => dispatch(entryLoaded(collection, loadedEntry)));
  };
}

export function loadEntries(collection, page = 0) {
  return (dispatch, getState) => {
    if (collection.get('isFetching')) { return; }
    const state = getState();
    const provider = hasSearchIntegration(state) && useSearchForListing(state) ?
      currentSearchIntegration(state.config) : currentBackend(state.config);
    dispatch(entriesLoading(collection));
    provider.entries(collection, page).then(
      (response) => dispatch(entriesLoaded(collection, response.entries, response.pagination)),
      (error) => dispatch(entriesFailed(collection, error))
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

export function persistEntry(collection, entry) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const MediaProxies = entry.get('mediaFiles').map(path => getMedia(state, path));
    dispatch(entryPersisting(collection, entry));
    backend.persistEntry(state.config, collection, entry, MediaProxies.toJS()).then(
      () => {
        dispatch(entryPersisted(collection, entry));
      },
      (error) => dispatch(entryPersistFail(collection, entry, error))
    );
  };
}

export function searchEntries(searchTerm, page = 0) {
  return (dispatch, getState) => {
    const state = getState();
    const collections = state.collections.keySeq().toArray();
    const provider = hasSearchIntegration(state) ?
      currentSearchIntegration(state.config) : currentBackend(state.config);
    dispatch(searchingEntries(searchTerm));
    provider.search(collections, searchTerm, page).then(
      (response) => dispatch(SearchSuccess(searchTerm, response.entries, response.pagination)),
      (error) => dispatch(SearchFailure(searchTerm, error))
    );
  };
}
