import { fromJS } from 'immutable';
import { Cursor } from 'netlify-cms-lib-util';

import {
  ENTRIES_SUCCESS,
  SORT_ENTRIES_SUCCESS,
  FILTER_ENTRIES_SUCCESS,
  GROUP_ENTRIES_SUCCESS,
} from '../actions/entries';

// Since pagination can be used for a variety of views (collections
// and searches are the most common examples), we namespace cursors by
// their type before storing them in the state.
export function selectCollectionEntriesCursor(state, collectionName) {
  return new Cursor(state.getIn(['cursorsByType', 'collectionEntries', collectionName]));
}

function cursors(state = fromJS({ cursorsByType: { collectionEntries: {} } }), action) {
  switch (action.type) {
    case ENTRIES_SUCCESS: {
      return state.setIn(
        ['cursorsByType', 'collectionEntries', action.payload.collection],
        Cursor.create(action.payload.cursor).store,
      );
    }
    case FILTER_ENTRIES_SUCCESS:
    case GROUP_ENTRIES_SUCCESS:
    case SORT_ENTRIES_SUCCESS: {
      return state.deleteIn(['cursorsByType', 'collectionEntries', action.payload.collection]);
    }
    default:
      return state;
  }
}

export default cursors;
