import { Map, List, fromJS } from 'immutable';
import {
  ENTRY_REQUEST,
  ENTRY_SUCCESS,
  ENTRY_FAILURE,
  ENTRIES_REQUEST,
  ENTRIES_SUCCESS,
  ENTRIES_FAILURE,
} from '../actions/entries';

import { SEARCH_ENTRIES_SUCCESS } from '../actions/search';

let collection;
let loadedEntries;
let page;

const entries = (state = Map({ entities: Map(), pages: Map() }), action) => {
  switch (action.type) {
    case ENTRY_REQUEST:
      return state.setIn(['entities', `${ action.payload.collection }.${ action.payload.slug }`, 'isFetching'], true);

    case ENTRY_SUCCESS:
      return state.setIn(
        ['entities', `${ action.payload.collection }.${ action.payload.entry.slug }`],
        fromJS(action.payload.entry)
      );

    case ENTRIES_REQUEST:
      return state.setIn(['pages', action.payload.collection, 'isFetching'], true);

    case ENTRIES_SUCCESS:
      collection = action.payload.collection;
      loadedEntries = action.payload.entries;
      page = action.payload.page;
      return state.withMutations((map) => {
        loadedEntries.forEach(entry => (
          map.setIn(['entities', `${ collection }.${ entry.slug }`], fromJS(entry).set('isFetching', false))
        ));

        const ids = List(loadedEntries.map(entry => entry.slug));
        map.setIn(['pages', collection], Map({
          page,
          ids: (!page || page === 0) ? ids : map.getIn(['pages', collection, 'ids'], List()).concat(ids),
        }));
      });

    case ENTRIES_FAILURE:
      return state.setIn(['pages', action.meta.collection, 'isFetching'], false);

    case ENTRY_FAILURE:
      return state.withMutations((map) => {
        map.setIn(['entities', `${ action.payload.collection }.${ action.payload.slug }`, 'isFetching'], false);
        map.setIn(['entities', `${ action.payload.collection }.${ action.payload.slug }`, 'error'], action.payload.error.message);
      });

    case SEARCH_ENTRIES_SUCCESS:
      loadedEntries = action.payload.entries;
      return state.withMutations((map) => {
        loadedEntries.forEach(entry => (
          map.setIn(['entities', `${ entry.collection }.${ entry.slug }`], fromJS(entry).set('isFetching', false))
        ));
      });

    default:
      return state;
  }
};

export const selectEntry = (state, collection, slug) => (
  state.getIn(['entities', `${ collection }.${ slug }`])
);

export const selectEntries = (state, collection) => {
  const slugs = state.getIn(['pages', collection, 'ids']);
  return slugs && slugs.map(slug => selectEntry(state, collection, slug));
};

export default entries;
