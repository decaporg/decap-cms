import { Map } from 'immutable';
import {
  OPEN_MEDIA_LIBRARY,
  CLOSE_MEDIA_LIBRARY,
  MEDIA_REQUEST,
  MEDIA_LOAD_SUCCESS,
  MEDIA_LOAD_ERROR,
  MEDIA_PERSIST_REQUEST,
  MEDIA_PERSIST_SUCCESS,
  MEDIA_PERSIST_FAILURE,
  MEDIA_DELETE_SUCCESS,
} from '../actions/mediaLibrary';

const mediaLibrary = (state = Map({ isVisible: false }), action) => {
  switch (action.type) {
    case OPEN_MEDIA_LIBRARY:
      return state.set('isVisible', true);
    case CLOSE_MEDIA_LIBRARY:
      return state.set('isVisible', false);
    case MEDIA_REQUEST:
      return state.set('isLoading', true);
    case MEDIA_LOAD_SUCCESS:
      return state.withMutations(map => map
        .set('isLoading', false)
        .set('files', action.payload.files)
      );
    case MEDIA_LOAD_ERROR:
      return state.set('isLoading', false);
    case MEDIA_PERSIST_REQUEST:
      return state.set('isPersisting', true);
    case MEDIA_PERSIST_SUCCESS:
    case MEDIA_PERSIST_FAILURE:
      return state.set('isPersisting', false);
    case MEDIA_DELETE_SUCCESS:
      const key = state.get('files').findIndex(file => file.path === action.payload.path);
      return state.deleteIn('files', key);
    default:
      return state;
  }
};

export default mediaLibrary;
