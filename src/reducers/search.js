import { Map, List } from 'immutable';

import {
  SEARCH_ENTRIES_REQUEST,
  SEARCH_ENTRIES_SUCCESS,
} from '../actions/search';

let loadedEntries;
let page;
let searchTerm;

const entries = (state = Map({ isFetching: false, term: null, page: 0, entryIds: [] }), action) => {
  switch (action.type) {
    case SEARCH_ENTRIES_REQUEST:
      if (action.payload.searchTerm !== state.getIn(['search', 'term'])) {
        return state.withMutations((map) => {
          map.set('isFetching', true);
          map.set('term', action.payload.searchTerm);
        });
      }
      return state;

    case SEARCH_ENTRIES_SUCCESS:
      loadedEntries = action.payload.entries;
      page = action.payload.page;
      searchTerm = action.payload.searchTerm;
      return state.withMutations((map) => {
        const entryIds = List(loadedEntries.map(entry => ({ collection: entry.collection, slug: entry.slug })));
        map.set('isFetching', false);
        map.set('page', page);
        map.set('term', searchTerm);
        map.set('entryIds', page === 0 ? entryIds : map.get('entryIds', List()).concat(entryIds));
      });

    default:
      return state;
  }
};

export default entries;
