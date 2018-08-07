import { currentBackend } from 'src/backend';
import { getIntegrationProvider } from 'Integrations';
import { selectIntegration } from 'Reducers';

/*
 * Contant Declarations
 */
export const SEARCH_ENTRIES_REQUEST = 'SEARCH_ENTRIES_REQUEST';
export const SEARCH_ENTRIES_SUCCESS = 'SEARCH_ENTRIES_SUCCESS';
export const SEARCH_ENTRIES_FAILURE = 'SEARCH_ENTRIES_FAILURE';

export const QUERY_REQUEST = 'INIT_QUERY';
export const QUERY_SUCCESS = 'QUERY_OK';
export const QUERY_FAILURE = 'QUERY_ERROR';

export const SEARCH_CLEAR = 'SEARCH_CLEAR';

/*
 * Simple Action Creators (Internal)
 * We still need to export them for tests
 */
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

export function querying(namespace, collection, searchFields, searchTerm) {
  return {
    type: QUERY_REQUEST,
    payload: {
      namespace,
      collection,
      searchFields,
      searchTerm,
    },
  };
}

export function querySuccess(namespace, collection, searchFields, searchTerm, response) {
  return {
    type: QUERY_SUCCESS,
    payload: {
      namespace,
      collection,
      searchFields,
      searchTerm,
      response,
    },
  };
}

export function queryFailure(namespace, collection, searchFields, searchTerm, error) {
  return {
    type: QUERY_SUCCESS,
    payload: {
      namespace,
      collection,
      searchFields,
      searchTerm,
      error,
    },
  };
}

/*
 * Exported simple Action Creators
 */

export function clearSearch() {
  return { type: SEARCH_CLEAR };
}

/*
 * Exported Thunk Action Creators
 */

// SearchEntries will search for complete entries in all collections.
export function searchEntries(searchTerm, page = 0) {
  return (dispatch, getState) => {
    dispatch(searchingEntries(searchTerm));

    const state = getState();
    const backend = currentBackend(state.config);
    const allCollections = state.collections.keySeq().toArray();
    const collections = allCollections.filter(collection =>
      selectIntegration(state, collection, 'search'),
    );
    const integration = selectIntegration(state, collections[0], 'search');

    const searchPromise = integration
      ? getIntegrationProvider(state.integrations, backend.getToken, integration).search(
          collections,
          searchTerm,
          page,
        )
      : backend.search(state.collections.valueSeq().toArray(), searchTerm);

    return searchPromise.then(
      response => dispatch(searchSuccess(searchTerm, response.entries, response.pagination)),
      error => dispatch(searchFailure(searchTerm, error)),
    );
  };
}

// Instead of searching for complete entries, query will search for specific fields
// in specific collections and return raw data (no entries).
export function query(namespace, collectionName, searchFields, searchTerm) {
  return (dispatch, getState) => {
    dispatch(querying(namespace, collectionName, searchFields, searchTerm));

    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, collectionName, 'search');
    const collection = state.collections.find(
      collection => collection.get('name') === collectionName,
    );

    const queryPromise = integration
      ? getIntegrationProvider(state.integrations, backend.getToken, integration).searchBy(
          searchFields.map(f => `data.${f}`),
          collectionName,
          searchTerm,
        )
      : backend.query(collection, searchFields, searchTerm);

    return queryPromise.then(
      response =>
        dispatch(querySuccess(namespace, collectionName, searchFields, searchTerm, response)),
      error => dispatch(queryFailure(namespace, collectionName, searchFields, searchTerm, error)),
    );
  };
}
