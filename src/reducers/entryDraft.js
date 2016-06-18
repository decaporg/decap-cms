import { Map, List } from 'immutable';
import { DRAFT_CREATE, DRAFT_DISCARD, DRAFT_CHANGE } from '../actions/entries';
import { ADD_MEDIA, REMOVE_MEDIA } from '../actions/media';

const initialState = Map({entry: Map(), mediaFiles: List()});

const entryDraft = (state = Map(), action) => {
  switch (action.type) {
    case DRAFT_CREATE:
      if (!action.payload) {
        // New entry
        return initialState;
      }
      // Existing Entry
      return state.withMutations((state) => {
        state.set('entry', action.payload);
        state.set('mediaFiles', List());
      });
    case DRAFT_DISCARD:
      return initialState;
    case DRAFT_CHANGE:
      return state.set('entry', action.payload);

    case ADD_MEDIA:
      return state.update('mediaFiles', (list) => list.push(action.payload.uri));
    case REMOVE_MEDIA:
      return state.update('mediaFiles', (list) => list.filterNot((uri) => uri === action.payload));

    default:
      return state;
  }
};

export default entryDraft;
