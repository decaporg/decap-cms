import { Map, List, fromJS } from 'immutable';
import { DRAFT_CREATE_FROM_ENTRY, DRAFT_CREATE_EMPTY, DRAFT_DISCARD, DRAFT_CHANGE } from '../actions/entries';
import { ADD_MEDIA, REMOVE_MEDIA } from '../actions/media';

const initialState = Map({ entry: Map(), mediaFiles: List() });

const entryDraft = (state = Map(), action) => {
  switch (action.type) {
    case DRAFT_CREATE_FROM_ENTRY:
      // Existing Entry
      return state.withMutations((state) => {
        state.set('entry', action.payload);
        state.setIn(['entry', 'newRecord'], false);
        state.set('mediaFiles', List());
      });
    case DRAFT_CREATE_EMPTY:
      // New Entry
      return state.withMutations((state) => {
        state.set('entry', fromJS(action.payload));
        state.setIn(['entry', 'newRecord'], true);
        state.set('mediaFiles', List());
      });
    case DRAFT_DISCARD:
      return initialState;
    case DRAFT_CHANGE:
      return state.set('entry', action.payload);

    case ADD_MEDIA:
      return state.update('mediaFiles', (list) => list.push(action.payload.public_path));
    case REMOVE_MEDIA:
      return state.update('mediaFiles', (list) => list.filterNot((path) => path === action.payload));

    default:
      return state;
  }
};

export default entryDraft;
