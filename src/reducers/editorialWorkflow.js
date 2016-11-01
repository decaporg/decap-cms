import { Map, List, fromJS } from 'immutable';
import { status, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import {
  UNPUBLISHED_ENTRY_REQUEST,
  UNPUBLISHED_ENTRY_SUCCESS,
  UNPUBLISHED_ENTRIES_REQUEST,
  UNPUBLISHED_ENTRIES_SUCCESS,
  UNPUBLISHED_ENTRY_PERSIST_REQUEST,
  UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
  UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
} from '../actions/editorialWorkflow';
import { CONFIG_SUCCESS } from '../actions/config';

const unpublishedEntries = (state = null, action) => {
  const publishMode = action.payload && action.payload.publish_mode;
  switch (action.type) {
    case CONFIG_SUCCESS:
      if (publishMode === EDITORIAL_WORKFLOW) {
        //  Editorial workflow state is explicetelly initiated after the config.
        return Map({ entities: Map(), pages: Map() });
      }
      return state;
    case UNPUBLISHED_ENTRY_REQUEST:
      return state.setIn(['entities', `${ action.payload.status }.${ action.payload.slug }`, 'isFetching'], true);

    case UNPUBLISHED_ENTRY_SUCCESS:
      return state.setIn(
        ['entities', `${ action.payload.status }.${ action.payload.entry.slug }`],
        fromJS(action.payload.entry)
      );


    case UNPUBLISHED_ENTRIES_REQUEST:
      return state.setIn(['pages', 'isFetching'], true);

    case UNPUBLISHED_ENTRIES_SUCCESS:
      const { entries, pages } = action.payload;
      return state.withMutations((map) => {
        entries.forEach(entry => (
          map.setIn(['entities', `${ entry.metaData.status }.${ entry.slug }`], fromJS(entry).set('isFetching', false))
        ));
        map.set('pages', Map({
          ...pages,
          ids: List(entries.map(entry => entry.slug)),
        }));
      });

    case UNPUBLISHED_ENTRY_PERSIST_REQUEST:
      // Update Optimistically
      const { collection, entry } = action.payload;
      const ownStatus = entry.getIn(['metaData', 'status'], status.first());
      return state.withMutations((map) => {
        map.setIn(['entities', `${ ownStatus }.${ entry.get('slug') }`], fromJS(entry));
        map.updateIn(['pages', 'ids'], List(), list => list.push(entry.get('slug')));
      });

    case UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST:
      // Update Optimistically
      return state.withMutations((map) => {
        let entry = map.getIn(['entities', `${ action.payload.oldStatus }.${ action.payload.slug }`]);
        entry = entry.setIn(['metaData', 'status'], action.payload.newStatus);

        let entities = map.get('entities').filter((val, key) => (
          key !== `${ action.payload.oldStatus }.${ action.payload.slug }`
        ));
        entities = entities.set(`${ action.payload.newStatus }.${ action.payload.slug }`, entry);

        map.set('entities', entities);
      });

    case UNPUBLISHED_ENTRY_PUBLISH_REQUEST:
      // Update Optimistically
      return state.deleteIn(['entities', `${ action.payload.status }.${ action.payload.slug }`]);

    default:
      return state;
  }
};

export const selectUnpublishedEntry = (state, status, slug) => {
  return state && state.getIn(['entities', `${ status }.${ slug }`]);
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
