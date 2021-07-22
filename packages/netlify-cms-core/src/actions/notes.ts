import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { Collection, Note, State } from '../types/redux';
import { currentBackend, Backend } from '../backend';

export const NOTES_REQUEST = 'NOTES_REQUEST';
export const NOTES_SUCCESS = 'NOTES_SUCCESS';
export const NOTES_FAILURE = 'NOTES_FAILURE';

type METADATA = {
  collection: string;
  slug: string;
};

function notesLoading(metadata: METADATA) {
  return {
    type: NOTES_REQUEST,
    payload: {
      ...metadata,
    },
  };
}

function notesLoaded(data: Array<Note>, metadata: METADATA) {
  return {
    type: NOTES_SUCCESS,
    payload: {
      ...metadata,
      data,
    },
  };
}

function notesLoadingFailed(error: Error, metadata: METADATA) {
  return {
    type: NOTES_FAILURE,
    payload: {
      ...metadata,
      error,
    },
  };
}

// export function notePersisting() {
//   return {};
// }
// function notePersisted() {}
// function notePersistingFailed() {}

export function listNotes(collection: Collection, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const collectionName = collection.get('name');
    const backend = currentBackend(state.config);

    dispatch(notesLoading({ collection: collectionName, slug }));

    try {
      const response = await backend.listNotes(collection, slug);
      dispatch(notesLoaded(response, { collection: collectionName, slug }));
    } catch (error) {
      console.error('Error fetching notes', error);
      dispatch(notesLoadingFailed(error, { collection: collectionName, slug }));
    }
  };
}

// export type NotesActions = ReturnType<
//   | typeof notePersisting
//   | typeof notePersisted
//   | typeof notePersistingFailed
//   | typeof notesLoading
//   | typeof notesLoaded
//   | typeof notesLoadingFailed
// >;
