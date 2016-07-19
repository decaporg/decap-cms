import { Map } from 'immutable';
import { ADD_MEDIA, REMOVE_MEDIA } from '../actions/media';
import { ENTRY_PERSIST_SUCCESS } from '../actions/entries';
import MediaProxy from '../valueObjects/MediaProxy';

const medias = (state = Map(), action) => {
  switch (action.type) {
    case ADD_MEDIA:
      return state.set(action.payload.path, action.payload);
    case REMOVE_MEDIA:
      return state.delete(action.payload);
    case ENTRY_PERSIST_SUCCESS:
      return state.map((media, path) => {
        if (action.payload.persistedMediaFiles.indexOf(path) > -1) media.uploaded = true;
        return media;
      });

    default:
      return state;
  }
};

export default medias;

export const getMedia = (state, path) => {
  if (state.has(path)) {
    return state.get(path);
  } else {
    return new MediaProxy(path, null, true);
  }
};
