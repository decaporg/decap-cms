import { currentBackend } from '../backends/backend';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
/*
 * Contant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';


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
