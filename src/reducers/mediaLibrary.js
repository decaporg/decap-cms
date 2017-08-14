import { Map } from 'immutable';
import {
  OPEN_MEDIA_LIBRARY,
  CLOSE_MEDIA_LIBRARY,
  MEDIA_REQUEST,
  MEDIA_LOAD_SUCCESS,
  MEDIA_LOAD_ERROR,
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
    default:
      return state;
  }
};

export default mediaLibrary;
