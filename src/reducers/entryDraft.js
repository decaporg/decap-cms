import { Map, List } from 'immutable';
import { DRAFT_CREATE_FROM_ENTRY, DRAFT_DISCARD, DRAFT_CHANGE } from '../actions/entries';
import { ADD_MEDIA, REMOVE_MEDIA } from '../actions/media';

const initialState = Map({ entry: Map(), mediaFiles: List() });

const entryDraft = (state = Map(), action) => {
  switch (action.type) {
    case DRAFT_CREATE_FROM_ENTRY:
      if (!action.payload) {
        // New entry
        return initialState;
      }
      // Existing Entry
      return state.withMutations((state) => {
        state.set('entry', action.payload);
        state.setIn(['entry', 'newRecord'], false);
        state.set('mediaFiles', List());
      });
    case DRAFT_DISCARD:
      return initialState;
    case DRAFT_CHANGE:
      return state.set('entry', action.payload);

    case ADD_MEDIA:
      return state.update('mediaFiles', (list) => list.push(action.payload.path));
    case REMOVE_MEDIA:
      return state.update('mediaFiles', (list) => list.filterNot((path) => path === action.payload));

    default:
      return state;
  }
};

export default entryDraft;
