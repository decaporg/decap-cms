import { Map, List, fromJS } from 'immutable';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
import {
  UNPUBLISHED_ENTRY_REQUEST, UNPUBLISHED_ENTRY_SUCCESS, UNPUBLISHED_ENTRIES_REQUEST, UNPUBLISHED_ENTRIES_SUCCESS
} from '../actions/editorialWorkflow';
import { CONFIG_SUCCESS } from '../actions/config';

const unpublishedEntries = (state = null, action) => {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const publish_mode = action.payload && action.payload.publish_mode;
      if (publish_mode === EDITORIAL_WORKFLOW) {
        //  Editorial workflow state is explicetelly initiated after the config.
        return Map({ entities: Map(), pages: Map() });
      } else {
        return state;
      }
    case UNPUBLISHED_ENTRY_REQUEST:
      return state.setIn(['entities', `${action.payload.status}.${action.payload.slug}`, 'isFetching'], true);

    case UNPUBLISHED_ENTRY_SUCCESS:
      return state.setIn(
        ['entities', `${action.payload.status}.${action.payload.entry.slug}`],
        fromJS(action.payload.entry)
      );


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
