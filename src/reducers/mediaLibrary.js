import { get } from 'lodash';
import { Map } from 'immutable';
import uuid from 'uuid/v4';
import {
  MEDIA_LIBRARY_OPEN,
  MEDIA_LIBRARY_CLOSE,
  MEDIA_INSERT,
  MEDIA_REMOVE_INSERTED,
  MEDIA_LOAD_REQUEST,
  MEDIA_LOAD_SUCCESS,
  MEDIA_LOAD_FAILURE,
  MEDIA_PERSIST_REQUEST,
  MEDIA_PERSIST_SUCCESS,
  MEDIA_PERSIST_FAILURE,
  MEDIA_DELETE_REQUEST,
  MEDIA_DELETE_SUCCESS,
  MEDIA_DELETE_FAILURE,
} from 'Actions/mediaLibrary';

const mediaLibrary = (state = Map({ isVisible: false, controlMedia: Map() }), action) => {
  const privateUploadChanged = state.get('privateUpload') !== get(action, ['payload', 'privateUpload']);
  switch (action.type) {
    case MEDIA_LIBRARY_OPEN: {
      const { controlID, forImage, privateUpload } = action.payload || {};
      if (privateUploadChanged) {
        return Map({
          isVisible: true,
          forImage,
          controlID,
          canInsert: !!controlID,
          privateUpload,
          controlMedia: Map(),
        });
      }
      return state.withMutations(map => {
        map.set('isVisible', true);
        map.set('forImage', forImage);
        map.set('controlID', controlID);
        map.set('canInsert', !!controlID);
        map.set('privateUpload', privateUpload);
      });
    }
    case MEDIA_LIBRARY_CLOSE:
      return state.set('isVisible', false);
    case MEDIA_INSERT: {
      const controlID = state.get('controlID');
      const mediaPath = get(action, ['payload', 'mediaPath']);
      return state.setIn(['controlMedia', controlID], mediaPath);
    }
    case MEDIA_REMOVE_INSERTED: {
      const controlID = get(action, ['payload', 'controlID']);
      return state.setIn(['controlMedia', controlID], '');
    }
    case MEDIA_LOAD_REQUEST:
      return state.withMutations(map => {
        map.set('isLoading', true);
        map.set('isPaginating', action.payload.page > 1);
      });
    case MEDIA_LOAD_SUCCESS: {
      const { files = [], page, canPaginate, dynamicSearch, dynamicSearchQuery, privateUpload } = action.payload;

      if (privateUploadChanged) {
        return state;
      }

      const filesWithKeys = files.map(file => ({ ...file, key: uuid() }));
      return state.withMutations(map => {
        map.set('isLoading', false);
        map.set('isPaginating', false);
        map.set('page', page);
        map.set('hasNextPage', canPaginate && files.length > 0);
        map.set('dynamicSearch', dynamicSearch);
        map.set('dynamicSearchQuery', dynamicSearchQuery);
        map.set('dynamicSearchActive', !!dynamicSearchQuery);
        if (page && page > 1) {
          const updatedFiles = map.get('files').concat(filesWithKeys);
          map.set('files', updatedFiles);
        } else {
          map.set('files', filesWithKeys);
        }
      });
    }
    case MEDIA_LOAD_FAILURE:
      if (privateUploadChanged) {
        return state;
      }
      return state.set('isLoading', false);
    case MEDIA_PERSIST_REQUEST:
      return state.set('isPersisting', true);
    case MEDIA_PERSIST_SUCCESS: {
      const { file } = action.payload;
      if (privateUploadChanged) {
        return state;
      }
      return state.withMutations(map => {
        const fileWithKey = { ...file, key: uuid() };
        const updatedFiles = [fileWithKey, ...map.get('files')];
        map.set('files', updatedFiles);
        map.set('isPersisting', false);
      });
    }
    case MEDIA_PERSIST_FAILURE:
      if (privateUploadChanged) {
        return state;
      }
      return state.set('isPersisting', false);
    case MEDIA_DELETE_REQUEST:
      return state.set('isDeleting', true);
    case MEDIA_DELETE_SUCCESS: {
      const { key } = action.payload.file;
      if (privateUploadChanged) {
        return state;
      }
      return state.withMutations(map => {
        const updatedFiles = map.get('files').filter(file => file.key !== key);
        map.set('files', updatedFiles);
        map.set('isDeleting', false);
      });
    }
    case MEDIA_DELETE_FAILURE:
      if (privateUploadChanged) {
        return state;
      }
      return state.set('isDeleting', false);
    default:
      return state;
  }
};

export default mediaLibrary;
