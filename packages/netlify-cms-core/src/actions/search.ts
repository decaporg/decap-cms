import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { State } from '../types/redux';
import { currentBackend } from '../backend';
import { getIntegrationProvider } from '../integrations';
import { selectIntegration } from '../reducers';
import { EntryValue } from '../valueObjects/Entry';
import { List } from 'immutable';

/*
 * Constant Declarations
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
export function searchingEntries(searchTerm: string, searchCollections: string[], page: number) {
  return {
    type: SEARCH_ENTRIES_REQUEST,
    payload: { searchTerm, searchCollections, page },
  };
}

export function searchSuccess(
  searchTerm: string,
  searchCollections: string[],
  entries: EntryValue[],
  page: number,
) {
  return {
    type: SEARCH_ENTRIES_SUCCESS,
    payload: {
      searchTerm,
      searchCollections,
      entries,
      page,
    },
  };
}

export function searchFailure(searchTerm: string, error: Error) {
  return {
    type: SEARCH_ENTRIES_FAILURE,
    payload: {
      searchTerm,
      error,
    },
  };
}

export function querying(
  namespace: string,
  collection: string,
  searchFields: string[],
  searchTerm: string,
) {
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

type Response = {
  entries: EntryValue[];
  pagination: number;
};

export function querySuccess(
  namespace: string,
  collection: string,
  searchFields: string[],
  searchTerm: string,
  response: Response,
) {
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

export function queryFailure(
  namespace: string,
  collection: string,
  searchFields: string[],
  searchTerm: string,
  error: Error,
) {
  return {
    type: QUERY_FAILURE,
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
export function searchEntries(
  searchTerm: string,
  searchCollections: string[] | null = null,
  page = 0,
) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const { search } = state;
    const backend = currentBackend(state.config);
    const allCollections = searchCollections || state.collections.keySeq().toArray();
    const collections = allCollections.filter(collection =>
      selectIntegration(state, collection as string, 'search'),
    );
    const integration = selectIntegration(state, collections[0] as string, 'search');

    // avoid duplicate searches
    if (
      search.get('isFetching') === true &&
      search.get('term') === searchTerm &&
      search.get('collections') !== null &&
      List(allCollections).equals(search.get('collections') as List<string>) &&
      // if an integration doesn't exist, 'page' is not used
      (search.get('page') === page || !integration)
    ) {
      return;
    }
    dispatch(searchingEntries(searchTerm, allCollections as string[], page));

    const searchPromise = integration
      ? getIntegrationProvider(state.integrations, backend.getToken, integration).search(
          collections,
          searchTerm,
          page,
        )
      : backend.search(
          state.collections
            .filter((_, key: string) => allCollections.indexOf(key) !== -1)
            .valueSeq()
            .toArray(),
          searchTerm,
        );

    return searchPromise.then(
      (response: Response) =>
        dispatch(
          searchSuccess(
            searchTerm,
            allCollections as string[],
            response.entries,
            response.pagination,
          ),
        ),
      (error: Error) => dispatch(searchFailure(searchTerm, error)),
    );
  };
}

// Instead of searching for complete entries, query will search for specific fields
// in specific collections and return raw data (no entries).
export function query(
  namespace: string,
  collectionName: string,
  searchFields: string[],
  searchTerm: string,
) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
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
      (response: Response) =>
        dispatch(querySuccess(namespace, collectionName, searchFields, searchTerm, response)),
      (error: Error) =>
        dispatch(queryFailure(namespace, collectionName, searchFields, searchTerm, error)),
    );
  };
}
