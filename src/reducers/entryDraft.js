import { Map, List } from 'immutable';
import { DRAFT_CREATE, DRAFT_DISCARD, DRAFT_CHANGE, DRAFT_ADD_MEDIA, DRAFT_REMOVE_MEDIA } from '../actions/entries';

const initialState = Map({entry: Map(), mediaFiles: List()});

export function entryDraft(state = Map(), action) {
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

    case DRAFT_ADD_MEDIA:
      return state.update('mediaFiles', (list) => list.push(action.payload));

    case DRAFT_REMOVE_MEDIA:
      const mediaIndex = state.get('mediaFiles').indexOf(action.payload);
      if (mediaIndex === -1) return state;
      return state.update('mediaFiles', (list) => list.splice(mediaIndex, 1));

    default:
      return state;
  }
}
