import { List } from 'immutable';
import { actions as notifActions } from 'redux-notifications';
import { closeEntry } from './editor';
import { currentBackend } from '../backends/backend';
import { getIntegrationProvider } from '../integrations';
import { getAsset, selectIntegration } from '../reducers';
import { createEntry } from '../valueObjects/Entry';

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
export const DRAFT_CHANGE_FIELD = 'DRAFT_CHANGE_FIELD';
export const DRAFT_VALIDATION_ERRORS = 'DRAFT_VALIDATION_ERRORS';

export const ENTRY_PERSIST_REQUEST = 'ENTRY_PERSIST_REQUEST';
export const ENTRY_PERSIST_SUCCESS = 'ENTRY_PERSIST_SUCCESS';
export const ENTRY_PERSIST_FAILURE = 'ENTRY_PERSIST_FAILURE';

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

export function entryLoadError(error, collection, slug) {
  return {
    type: ENTRY_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug,
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

export function emptyDraftCreated(entry) {
  return {
    type: DRAFT_CREATE_EMPTY,
    payload: entry,
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

export function changeDraftField(field, value, metadata) {
  return {
    type: DRAFT_CHANGE_FIELD,
    payload: { field, value, metadata },
  };
}

export function changeDraftFieldValidation(field, errors) {
  return {
    type: DRAFT_VALIDATION_ERRORS,
    payload: { field, errors },
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
    return backend.getEntry(collection, slug)
      .then(loadedEntry => (
        dispatch(entryLoaded(collection, loadedEntry))
      ))
      .catch((error) => {
        dispatch(notifSend({
          message: `Failed to load entry: ${ error.message }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
        dispatch(entryLoadError(error, collection, slug));
      });
  };
}

export function loadEntries(collection, page = 0) {
  return (dispatch, getState) => {
    if (collection.get('isFetching')) {
      return;
    }
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, collection.get('name'), 'listEntries');
    const provider = integration ? getIntegrationProvider(state.integrations, backend.getToken, integration) : backend;
    dispatch(entriesLoading(collection));
    provider.listEntries(collection, page).then(
      response => dispatch(entriesLoaded(collection, response.entries.reverse(), response.pagination)),
      error => dispatch(entriesFailed(collection, error))
    );
  };
}

export function createEmptyDraft(collection) {
  return (dispatch) => {
    const dataFields = {};
    collection.get('fields', List()).forEach((field) => {
      dataFields[field.get('name')] = field.get('default', null);
    });
    const newEntry = createEntry(collection.get('name'), '', '', { data: dataFields });
    dispatch(emptyDraftCreated(newEntry));
  };
}

export function persistEntry(collection) {
  return (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;

    // Early return if draft contains validation errors
    if (!entryDraft.get('fieldsErrors').isEmpty()) return;
    
    const backend = currentBackend(state.config);
    const assetProxies = entryDraft.get('mediaFiles').map(path => getAsset(state, path));
    const entry = entryDraft.get('entry');
    dispatch(entryPersisting(collection, entry));
    backend
      .persistEntry(state.config, collection, entryDraft, assetProxies.toJS())
      .then(() => {
        dispatch(notifSend({
          message: 'Entry saved',
          kind: 'success',
          dismissAfter: 4000,
        }));
        dispatch(entryPersisted(collection, entry));
        dispatch(closeEntry(collection));
      })
      .catch((error) => {
        dispatch(notifSend({
          message: `Failed to persist entry: ${ error }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
        dispatch(entryPersistFail(collection, entry, error));
      });
  };
}
