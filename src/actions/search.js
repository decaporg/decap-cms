import fuzzy from 'fuzzy';
import { currentBackend } from 'Backends/backend';
import { getIntegrationProvider } from 'Integrations';
import { selectIntegration, selectEntries } from 'Reducers';
import { selectInferedField } from 'Reducers/collections';
import { WAIT_UNTIL_ACTION } from 'Redux/middleware/waitUntilAction';
import { loadEntries, ENTRIES_SUCCESS } from './entries';

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
    const state = getState();
    const allCollections = state.collections.keySeq().toArray();
    const collections = allCollections.filter(collection => selectIntegration(state, collection, 'search'));
    const integration = selectIntegration(state, collections[0], 'search');
    if (!integration) {
      localSearch(searchTerm, getState, dispatch);
    } else {
      const provider = getIntegrationProvider(state.integrations, currentBackend(state.config).getToken, integration);
      dispatch(searchingEntries(searchTerm));
      provider.search(collections, searchTerm, page).then(
        response => dispatch(searchSuccess(searchTerm, response.entries, response.pagination)),
        error => dispatch(searchFailure(searchTerm, error))
      );
    }
  };
}

// Instead of searching for complete entries, query will search for specific fields
// in specific collections and return raw data (no entries).
export function query(namespace, collection, searchFields, searchTerm) {
  return (dispatch, getState) => {
    const state = getState();
    const integration = selectIntegration(state, collection, 'search');
    dispatch(querying(namespace, collection, searchFields, searchTerm));
    if (!integration) {
      localQuery(namespace, collection, searchFields, searchTerm, state, dispatch);
    } else {
      const provider = getIntegrationProvider(state.integrations, currentBackend(state.config).getToken, integration);
      provider.searchBy(searchFields.map(f => `data.${ f }`), collection, searchTerm).then(
        response => dispatch(querySuccess(namespace, collection, searchFields, searchTerm, response)),
        error => dispatch(queryFailure(namespace, collection, searchFields, searchTerm, error))
      );
    }
  };
}

// Local Query & Search functions

function localSearch(searchTerm, getState, dispatch) {
  return (function acc(localResults = { entries: [] }) {
    function processCollection(collection, collectionKey) {
      const state = getState();
      if (state.entries.hasIn(['pages', collectionKey, 'ids'])) {
        const searchFields = [
          selectInferedField(collection, 'title'),
          selectInferedField(collection, 'shortTitle'),
          selectInferedField(collection, 'author'),
        ];
        const collectionEntries = selectEntries(state, collectionKey).toJS();
        const filteredEntries = fuzzy.filter(searchTerm, collectionEntries, {
          extract: entry => searchFields.reduce((acc, field) => {
            const f = entry.data[field];
            return f ? `${ acc } ${ f }` : acc;
          }, ""),
        }).filter(entry => entry.score > 5);
        localResults[collectionKey] = true;
        localResults.entries = localResults.entries.concat(filteredEntries);
        
        const returnedKeys = Object.keys(localResults);
        const allCollections = state.collections.keySeq().toArray();
        if (allCollections.every(v => returnedKeys.indexOf(v) !== -1)) {
          const sortedResults = localResults.entries.sort((a, b) => {
            if (a.score > b.score) return -1;
            if (a.score < b.score) return 1;
            return 0;
          }).map(f => f.original);
          if (allCollections.size > 3 || localResults.entries.length > 30) {
            console.warn('The Netlify CMS is currently using a Built-in search.' +
            '\nWhile this works great for small sites, bigger projects might benefit from a separate search integration.' + 
            '\nPlease refer to the documentation for more information');
          }
          dispatch(searchSuccess(searchTerm, sortedResults, 0));
        }
      } else {
        // Collection entries aren't loaded yet.
        // Dispatch loadEntries and wait before redispatching this action again.
        dispatch({
          type: WAIT_UNTIL_ACTION,
          predicate: action => (action.type === ENTRIES_SUCCESS && action.payload.collection === collectionKey),
          run: () => processCollection(collection, collectionKey),
        });
        dispatch(loadEntries(collection));
      }
    }
    getState().collections.forEach(processCollection);
  }());
}


function localQuery(namespace, collection, searchFields, searchTerm, state, dispatch) {
  // Check if entries in this collection were already loaded
  if (state.entries.hasIn(['pages', collection, 'ids'])) {
    const entries = selectEntries(state, collection).toJS();
    const filteredEntries = fuzzy.filter(searchTerm, entries, {
      extract: entry => searchFields.reduce((acc, field) => {
        const f = entry.data[field];
        return f ? `${ acc } ${ f }` : acc;
      }, ""),
    }).filter(entry => entry.score > 5);

    const resultObj = {
      query: searchTerm,
      hits: [],
    };

    resultObj.hits = filteredEntries.map(f => f.original);
    dispatch(querySuccess(namespace, collection, searchFields, searchTerm, resultObj));
  } else {
    // Collection entries aren't loaded yet.
    // Dispatch loadEntries and wait before redispatching this action again.
    dispatch({
      type: WAIT_UNTIL_ACTION,
      predicate: action => (action.type === ENTRIES_SUCCESS && action.payload.collection === collection),
      run: dispatch => dispatch(query(namespace, collection, searchFields, searchTerm)),
    });
    dispatch(loadEntries(state.collections.get(collection)));
  }
}
