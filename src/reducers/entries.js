import { Map, List, fromJS } from 'immutable';
import {
  ENTRY_REQUEST, ENTRY_SUCCESS, ENTRIES_REQUEST, ENTRIES_SUCCESS,
} from '../actions/entries';

const entriesReducer = (state = Map({ entities: Map(), pages: Map() }), action) => {
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

    case ENTRIES_SUCCESS: {
      const { collection, entries, pages } = action.payload;
      return state.withMutations((map) => {
        entries.forEach(entry => (
          map.setIn(['entities', `${ collection }.${ entry.slug }`], fromJS(entry).set('isFetching', false))
        ));
        map.setIn(['pages', collection], Map({
          ...pages,
          ids: List(entries.map(entry => entry.slug)),
        }));
      });
    }
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

export default entriesReducer;
