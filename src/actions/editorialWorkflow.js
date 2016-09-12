import { currentBackend } from '../backends/backend';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
/*
 * Contant Declarations
 */
export const INIT = 'init';
export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';


/*
 * Simple Action Creators (Internal)
 */
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
 * Exported simple Action Creators
 */
export function init() {
  return {
    type: INIT
  };
}


/*
 * Exported Thunk Action Creators
 */
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
