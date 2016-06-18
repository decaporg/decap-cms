import { Map } from 'immutable';
import { ADD_MEDIA, REMOVE_MEDIA } from '../actions/media';
import { ENTRY_PERSIST_SUCCESS } from '../actions/entries';
import MediaProxy from '../valueObjects/MediaProxy';

const medias = (state = Map(), action) => {
  switch (action.type) {
    case ADD_MEDIA:
      return state.set(action.payload.uri, action.payload);
    case REMOVE_MEDIA:
      return state.delete(action.payload);
    case ENTRY_PERSIST_SUCCESS:
      return state.map((media, uri) => {
        if (action.payload.persistedMediaFiles.indexOf(uri) > -1) media.uploaded = true;
        return media;
      });

    default:
      return state;
  }
};

export default medias;

export const getMedia = (state, uri) => {
  if (state.has(uri)) {
    return state.get(uri);
  } else {
    return new MediaProxy(uri, null, true);
  }
};
