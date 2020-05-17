import { Map, List } from 'immutable';

import {
  SEARCH_ENTRIES_REQUEST,
  SEARCH_ENTRIES_SUCCESS,
  QUERY_REQUEST,
  QUERY_SUCCESS,
  SEARCH_CLEAR,
} from 'Actions/search';

let loadedEntries;
let response;
let page;
let searchTerm;

const defaultState = Map({
  isFetching: false,
  term: null,
  page: 0,
  entryIds: List([]),
  queryHits: Map({}),
});

const entries = (state = defaultState, action) => {
  switch (action.type) {
    case SEARCH_CLEAR:
      return defaultState;

    case SEARCH_ENTRIES_REQUEST:
      if (action.payload.searchTerm !== state.get('term')) {
        return state.withMutations(map => {
          map.set('isFetching', true);
          map.set('term', action.payload.searchTerm);
          map.set('page', action.payload.page);
        });
      }
      return state;

    case SEARCH_ENTRIES_SUCCESS:
      loadedEntries = action.payload.entries;
      page = action.payload.page;
      searchTerm = action.payload.searchTerm;
      return state.withMutations(map => {
        const entryIds = List(
          loadedEntries.map(entry => ({ collection: entry.collection, slug: entry.slug })),
        );
        map.set('isFetching', false);
        map.set('fetchID', null);
        map.set('page', page);
        map.set('term', searchTerm);
        map.set(
          'entryIds',
          !page || isNaN(page) || page === 0
            ? entryIds
            : map.get('entryIds', List()).concat(entryIds),
        );
      });

    case QUERY_REQUEST:
      if (action.payload.searchTerm !== state.get('term')) {
        return state.withMutations(map => {
          map.set('isFetching', action.payload.namespace ? true : false);
          map.set('fetchID', action.payload.namespace);
          map.set('term', action.payload.searchTerm);
        });
      }
      return state;

    case QUERY_SUCCESS:
      searchTerm = action.payload.searchTerm;
      response = action.payload.response;
      return state.withMutations(map => {
        map.set('isFetching', false);
        map.set('fetchID', null);
        map.set('term', searchTerm);
        map.mergeIn(['queryHits'], Map({ [action.payload.namespace]: response.hits }));
      });

    default:
      return state;
  }
};

export default entries;
