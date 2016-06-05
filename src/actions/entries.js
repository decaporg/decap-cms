import { currentBackend } from '../backends/backend';

export const ENTRY_REQUEST = 'ENTRY_REQUEST';
export const ENTRY_SUCCESS = 'ENTRY_SUCCESS';
export const ENTRY_FAILURE = 'ENTRY_FAILURE';

export const ENTRIES_REQUEST = 'ENTRIES_REQUEST';
export const ENTRIES_SUCCESS = 'ENTRIES_SUCCESS';
export const ENTRIES_FAILURE = 'ENTRIES_FAILURE';

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

export function entriesLoaded(collection, entries, pagination) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries: entries,
      pages: pagination
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

export function entriesFailed(collection, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: {collection: collection.get('name')}
  };
}

export function loadEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(entryLoading(collection, slug));
    backend.entry(collection, slug)
      .then((entry) => dispatch(entryLoaded(collection, entry)));
  };
}

export function loadEntries(collection) {
  return (dispatch, getState) => {
    if (collection.get('isFetching')) { return; }
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(entriesLoading(collection));
    backend.entries(collection)
      .then((response) => dispatch(entriesLoaded(collection, response.entries, response.pagination)))
  };
}
