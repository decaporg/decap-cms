import { get } from 'lodash';
import { Map } from 'immutable';
import {
  MEDIA_LIBRARY_OPEN,
  MEDIA_LIBRARY_CLOSE,
  MEDIA_INSERT,
  MEDIA_LOAD_REQUEST,
  MEDIA_LOAD_SUCCESS,
  MEDIA_LOAD_ERROR,
  MEDIA_PERSIST_REQUEST,
  MEDIA_PERSIST_SUCCESS,
  MEDIA_PERSIST_FAILURE,
  MEDIA_DELETE_REQUEST,
  MEDIA_DELETE_SUCCESS,
  MEDIA_DELETE_FAILURE,
} from '../actions/mediaLibrary';

const mediaLibrary = (state = Map({ isVisible: false, controlMedia: Map() }), action) => {
  switch (action.type) {
    case MEDIA_LIBRARY_OPEN: {
      const { controlID, forImage } = action.payload || {};
      return state.withMutations(map => {
        map.set('isVisible', true);
        map.set('forImage', forImage);
        map.set('controlID', controlID);
        map.set('canInsert', !!controlID);
      });
    }
    case MEDIA_LIBRARY_CLOSE:
      return state.set('isVisible', false);
    case MEDIA_INSERT: {
      const controlID = state.get('controlID');
      const mediaPath = get(action, ['payload', 'mediaPath']);
      return state.setIn(['controlMedia', controlID], mediaPath);
    }
    case MEDIA_LOAD_REQUEST:
      return state.set('isLoading', true);
    case MEDIA_LOAD_SUCCESS:
      return state.withMutations(map => {
        map.set('isLoading', false)
        map.set('files', action.payload.files)
      });
    case MEDIA_LOAD_ERROR:
      return state.set('isLoading', false);
    case MEDIA_PERSIST_REQUEST:
      return state.set('isPersisting', true);
    case MEDIA_PERSIST_SUCCESS:
    case MEDIA_PERSIST_FAILURE:
      return state.set('isPersisting', false);
    case MEDIA_DELETE_REQUEST:
      return state.set('isDeleting', true);
    case MEDIA_DELETE_SUCCESS:
    case MEDIA_DELETE_FAILURE:
      return state.set('isDeleting', false);
    default:
      return state;
  }
};

export default mediaLibrary;
