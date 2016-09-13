import { Map, List, fromJS } from 'immutable';
import {
  INIT, UNPUBLISHED_ENTRIES_REQUEST, UNPUBLISHED_ENTRIES_SUCCESS
} from '../actions/editorialWorkflow';

const unpublishedEntries = (state = null, action) => {
  switch (action.type) {
    case INIT:
      //  Editorial workflow must be explicitly initiated.
      return Map({ entities: Map(), pages: Map() });
    case UNPUBLISHED_ENTRIES_REQUEST:
      return state.setIn(['pages', 'isFetching'], true);

    case UNPUBLISHED_ENTRIES_SUCCESS:
      const { entries, pages } = action.payload;
      return state.withMutations((map) => {
        entries.forEach((entry) => (
          map.setIn(['entities', `${entry.metaData.status}.${entry.slug}`], fromJS(entry).set('isFetching', false))
        ));
        map.set('pages', Map({
          ...pages,
          ids: List(entries.map((entry) => entry.slug))
        }));
      });
    default:
      return state;
  }
};

export const selectUnpublishedEntry = (state, status, slug) => {
  return state && state.getIn(['entities', `${status}.${slug}`]);
};

export const selectUnpublishedEntries = (state, status) => {
  if (!state) return;
  const slugs = state.getIn(['pages', 'ids']);

  return slugs && slugs.reduce((acc, slug) => {
    const entry = selectUnpublishedEntry(state, status, slug);
    if (entry) {
      return acc.push(entry);
    } else {
      return acc;
    }
  }, List());
};


export default unpublishedEntries;
