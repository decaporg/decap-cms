import { Map } from 'immutable';
import {
  ENTRIES_SUCCESS,
} from 'Actions/entries';

// Since pagination can be used for a variety of views (collections
// and searches are the most common examples), we namespace cursors by
// their type before storing them in the state.
export const collectionEntriesCursorKey = collectionName => `collectionEntries.${ collectionName }`;

const cursors = (state = Map(), action) => {
  switch (action.type) {
    case ENTRIES_SUCCESS: {
      const collection = action.payload.collection;
      const cursor = action.payload.cursor;
      if (cursor) {
        return state.set(collectionEntriesCursorKey(collection), cursor);
      }
      return state;
    }

    default:
      return state;
  }
};

export default cursors;
