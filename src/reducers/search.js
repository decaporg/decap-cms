import { Map, List } from 'immutable';
import {
  SEARCH_ENTRIES_REQUEST,
  SEARCH_ENTRIES_SUCCESS,
  QUERY_REQUEST,
  QUERY_SUCCESS,
  SEARCH_CLEAR,
} from 'Actions/search';
import { CURSOR_SET } from 'Actions/cursor';

const defaultState = Map({ isFetching: false, term: null, entryIds: List([]), queryHits: Map({}) });

const entries = (state = defaultState, action) => {
  switch (action.type) {
    case CURSOR_SET: {
      const { search, cursor } = action.payload;
      if (search) {
        return state.set('cursor', cursor);
      }
      return state;
    }

    case SEARCH_CLEAR:
      return defaultState;

    case SEARCH_ENTRIES_REQUEST:
      if (action.payload.searchTerm !== state.get('term')) {
        return state.withMutations((map) => {
          map.set('isFetching', true);
          map.set('term', action.payload.searchTerm);
        });
      }
      return state;

    case SEARCH_ENTRIES_SUCCESS: {
      const { entries: loadedEntries, searchTerm, append } = action.payload;
      return state.withMutations((map) => {
        const entryIds = List(loadedEntries.map(entry => ({ collection: entry.collection, slug: entry.slug })));
        map.set('isFetching', false);
        map.set('term', searchTerm);
        map.set('entryIds', append ? map.get('entryIds', List()).concat(entryIds) : entryIds);
      });
    }

    case QUERY_REQUEST:
      if (action.payload.searchTerm !== state.get('term')) {
        return state.withMutations((map) => {
          map.set('isFetching', action.payload.namespace);
          map.set('term', action.payload.searchTerm);
        });
      }
      return state;

    case QUERY_SUCCESS: {
      const searchTerm = action.payload.searchTerm;
      const response = action.payload.response;
      return state.withMutations((map) => {
        map.set('isFetching', false);
        map.set('term', searchTerm);
        map.mergeIn(['queryHits'], Map({ [action.payload.namespace]: response.hits }));
      });
    }

    default:
      return state;
  }
};

export default entries;
