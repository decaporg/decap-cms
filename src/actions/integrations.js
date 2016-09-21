import { currentSearchIntegration } from '../integrations/search';

/*
 * Contant Declarations
 */
export const SEARCH_REQUEST = 'SEARCH_REQUEST';
export const SEARCH_RESPONSE = 'SEARCH_RESPONSE';

/*
 * Simple Action Creators (Internal)
 */
function requestedSearch(collection, query) {
  return {
    type: SEARCH_REQUEST,
    payload: {
      collection: collection,
      query: query
    }
  };
}

function searchResponse(results) {
  return {
    type: SEARCH_RESPONSE,
    payload: { results }
  };
}

/*
 * Exported Thunk Action Creators
 */
export function search(collection, query) {
  return (dispatch, getState) => {
    const state = getState();
    const searchIntegration = currentSearchIntegration(state.config);

    dispatch(requestedSearch(collection, query));
    searchIntegration.search(collection, query)
      .then((results) => dispatch(searchResponse(results)));
  };
}
