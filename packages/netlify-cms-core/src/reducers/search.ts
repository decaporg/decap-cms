import { produce } from 'immer';

import {
  QUERY_FAILURE,
  QUERY_REQUEST,
  QUERY_SUCCESS,
  SEARCH_CLEAR,
  SEARCH_ENTRIES_FAILURE,
  SEARCH_ENTRIES_REQUEST,
  SEARCH_ENTRIES_SUCCESS,
  SearchAction,
} from '../actions/search';
import { EntryValue } from '../valueObjects/Entry';

export type Search = {
  isFetching: boolean;
  term: string;
  collections: string[];
  page: number;
  entryIds: { collection: string; slug: string }[];
  queryHits: Record<string, EntryValue[]>;
  error: Error | undefined;
};

const defaultState: Search = {
  isFetching: false,
  term: '',
  collections: [],
  page: 0,
  entryIds: [],
  queryHits: {},
  error: undefined,
};

const search = produce((state: Search, action: SearchAction) => {
  switch (action.type) {
    case SEARCH_CLEAR:
      return defaultState;

    case SEARCH_ENTRIES_REQUEST: {
      const { page, searchTerm, searchCollections } = action.payload;
      state.isFetching = true;
      state.term = searchTerm;
      state.collections = searchCollections;
      state.page = page;
      break;
    }

    case SEARCH_ENTRIES_SUCCESS: {
      const { entries, page } = action.payload;
      const entryIds = entries.map(entry => ({ collection: entry.collection, slug: entry.slug }));
      state.isFetching = false;
      state.page = page;
      state.entryIds =
        !page || isNaN(page) || page === 0 ? entryIds : state.entryIds.concat(entryIds);
      break;
    }

    case SEARCH_ENTRIES_FAILURE: {
      const { error } = action.payload;
      state.isFetching = false;
      state.error = error;
      break;
    }

    case QUERY_REQUEST: {
      const { searchTerm } = action.payload;
      state.isFetching = true;
      state.term = searchTerm;
      break;
    }

    case QUERY_SUCCESS: {
      const { namespace, hits } = action.payload;
      state.isFetching = false;
      state.queryHits[namespace] = hits;
      break;
    }

    case QUERY_FAILURE: {
      const { error } = action.payload;
      state.isFetching = false;
      state.error = error;
    }
  }
}, defaultState);

export default search;
