import { Map, List } from 'immutable';

import {
  SEARCH_ENTRIES_REQUEST,
  SEARCH_ENTRIES_SUCCESS,
  QUERY_REQUEST,
  QUERY_SUCCESS,
  SEARCH_CLEAR,
} from '../actions/search';

let namespace;
let loadedEntries;
let response;
let page;
let searchTerm;

const defaultState = Map({ isFetching: Map({}), page: 0, entryIds: List([]), queryHits: Map({}) });

const entries = (state = defaultState, action) => {
  switch (action.type) {
    case SEARCH_CLEAR:
      return defaultState;

    case SEARCH_ENTRIES_REQUEST:
      searchTerm = action.payload.searchTerm;
      if (searchTerm !== state.getIn(['isFetching', 'search', 'term'], '')) {
        return state.setIn(['isFetching', 'search'], Map({ isFetching: true, term: searchTerm }));
      }
      return state;

    case SEARCH_ENTRIES_SUCCESS:
      loadedEntries = action.payload.entries;
      page = action.payload.page;
      searchTerm = action.payload.searchTerm;
      return state.withMutations((map) => {
        const entryIds = List(loadedEntries.map(entry => ({ collection: entry.collection, slug: entry.slug })));
        map.setIn(['isFetching', 'search'], Map({ isFetching: false, page, term: searchTerm }));
        map.set('page', page);
        map.set('entryIds', page === 0 ? entryIds : map.get('entryIds', List()).concat(entryIds));
      });

    case QUERY_REQUEST:
      namespace = action.payload.namespace;
      searchTerm = action.payload.searchTerm;
      if (searchTerm !== state.getIn(['isFetching', namespace, 'term'], '')) {
        return state.setIn(['isFetching', namespace], Map({ isFetching: true, term: searchTerm }));
      }
      return state;

    case QUERY_SUCCESS:
      namespace = action.payload.namespace;
      searchTerm = action.payload.searchTerm;
      response = action.payload.response;
      return state.withMutations((map) => {
        map.setIn(['isFetching', namespace], Map({ isFetching: false, term: searchTerm }));
        map.setIn(['queryHits', namespace], response.hits);
      });

    default:
      return state;
  }
};

export default entries;
