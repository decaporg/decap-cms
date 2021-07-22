import { Map } from 'immutable';
// import { dirname, join } from 'path';
import { NOTES_REQUEST, NOTES_SUCCESS, NOTES_FAILURE } from '../actions/notes';
import {
  NotesAction,
  NotesRequestPayload,
  NotesSuccessPayload,
  NotesFailurePayload,
} from '../types/redux';

function notesReducer(state = Map({ notes: Map() }), action: NotesAction) {
  switch (action.type) {
    case NOTES_REQUEST: {
      const payload = action.payload as NotesRequestPayload;
      return state.setIn(['notes', `${payload.collection}.${payload.slug}`, 'isFetching'], true);
    }

    case NOTES_SUCCESS: {
      const payload = action.payload as NotesSuccessPayload;
      console.log(payload);
      return state.withMutations(map => {
        map.setIn(['notes', `${payload.collection}.${payload.slug}`, 'isFetching'], false);
        map.setIn(['notes', `${payload.collection}.${payload.slug}`, 'data'], payload.data);
      });
    }

    case NOTES_FAILURE: {
      const payload = action.payload as NotesFailurePayload;
      return state.withMutations(map => {
        map.setIn(['notes', `${payload.collection}.${payload.slug}`, 'isFetching'], false);
        map.setIn(
          ['notes', `${payload.collection}.${payload.slug}`, 'error'],
          payload.error.message,
        );
      });
    }

    default:
      return state;
  }
}

export default notesReducer;
