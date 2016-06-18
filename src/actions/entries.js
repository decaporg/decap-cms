import { currentBackend } from '../backends/backend';

/*
 * Contant Declarations
 */
export const ENTRY_REQUEST = 'ENTRY_REQUEST';
export const ENTRY_SUCCESS = 'ENTRY_SUCCESS';
export const ENTRY_FAILURE = 'ENTRY_FAILURE';

export const ENTRIES_REQUEST = 'ENTRIES_REQUEST';
export const ENTRIES_SUCCESS = 'ENTRIES_SUCCESS';
export const ENTRIES_FAILURE = 'ENTRIES_FAILURE';

export const DRAFT_CREATE = 'DRAFT_CREATE';
export const DRAFT_DISCARD = 'DRAFT_DISCARD';
export const DRAFT_CHANGE = 'DRAFT_CHANGE';


export const ENTRY_PERSIST_REQUEST = 'ENTRY_PERSIST_REQUEST';
export const ENTRY_PERSIST_SUCCESS = 'ENTRY_PERSIST_SUCCESS';
export const ENTRY_PERSIST_FAILURE = 'ENTRY_PERSIST_FAILURE';


/*
 * Simple Action Creators (Internal)
 */
function entryLoading(collection, slug) {
  return {
    type: ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug: slug
    }
  };
}

function entryLoaded(collection, entry) {
  return {
    type: ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry: entry
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

function entriesLoaded(collection, entries, pagination) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries: entries,
      pages: pagination
    }
  };
}

function entriesFailed(collection, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: {collection: collection.get('name')}
  };
}

function entryPersisting(collection, entry) {
  return {
    type: ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection,
      entry: entry
    }
  };
}

function entryPersisted(persistedEntry, persistedMediaFiles) {
  return {
    type: ENTRY_PERSIST_SUCCESS,
    payload: {
      persistedEntry: persistedEntry,
      persistedMediaFiles: persistedMediaFiles
    }
  };
}

function entryPersistFail(collection, entry, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to persist entry',
    payload: error.toString()
  };
}

/*
 * Exported simple Action Creators
 */
export function createDraft(entry) {
  return {
    type: DRAFT_CREATE,
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
    backend.entries(collection).then(
      (response) => dispatch(entriesLoaded(collection, response.entries, response.pagination)),
      (error) => dispatch(entriesFailed(collection, error))
    );
  };
}

export function persist(collection, entry, mediaFiles) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(entryPersisting(collection, entry));
    backend.persist(collection, entry, mediaFiles).then(
      ({persistedEntry, persistedMediaFiles}) => {
        dispatch(entryPersisted(persistedEntry, persistedMediaFiles));
      },
      (error) => dispatch(entryPersistFail(collection, entry, error))
    );
  };
}
