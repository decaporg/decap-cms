import { get } from 'lodash';
import { Map } from 'immutable';
import {
  OPEN_MEDIA_LIBRARY,
  CLOSE_MEDIA_LIBRARY,
  MEDIA_INSERT,
  MEDIA_REQUEST,
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
    case OPEN_MEDIA_LIBRARY: {
      const { controlID, forImage } = action.payload || {};
      return state.withMutations(map => {
        map.set('isVisible', true);
        map.set('forImage', forImage);
        map.set('controlID', controlID);
        map.set('canInsert', !!controlID);
      });
    }
    case CLOSE_MEDIA_LIBRARY:
      return state.set('isVisible', false);
    case MEDIA_INSERT: {
      const controlID = state.get('controlID');
      const mediaPath = get(action, ['payload', 'mediaPath']);
      return state.setIn(['controlMedia', controlID], mediaPath);
    }
    case MEDIA_REQUEST:
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
    case MEDIA_DELETE_SUCCESS: {
      const key = state.get('files').findIndex(file => file.path === action.payload.path);
      return state.withMutations(map => {
        map.deleteIn('files', key);
        map.set('isDeleting', false);
      });
    }
    case MEDIA_DELETE_FAILURE:
      return state.set('isDeleting', false);
    default:
      return state;
  }
};

export default mediaLibrary;
