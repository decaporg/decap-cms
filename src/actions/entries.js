import { currentBackend } from '../backends/backend';

export const ENTRIES_REQUEST = 'ENTRIES_REQUEST';
export const ENTRIES_SUCCESS = 'ENTRIES_SUCCESS';
export const ENTRIES_FAILURE = 'ENTRIES_FAILURE';

export function entriesLoaded(collection, entries) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries: entries
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

export function loadEntries(collection) {
  return (dispatch, getState) => {
    if (collection.get('isFetching')) { return; }
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(entriesLoading(collection));
    backend.entries(collection)
      .then((entries) => dispatch(entriesLoaded(collection, entries)))
      .catch((err) => {
        console.error(err);
        return dispatch(entriesFailed(collection, err));
      });
  };
}
