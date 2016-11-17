import { Map } from 'immutable';
import { ADD_MEDIA, REMOVE_MEDIA } from '../actions/media';
import MediaProxy from '../valueObjects/MediaProxy';

const medias = (state = Map(), action) => {
  switch (action.type) {
    case ADD_MEDIA:
      return state.set(action.payload.public_path, action.payload);
    case REMOVE_MEDIA:
      return state.delete(action.payload);

    default:
      return state;
  }
};

export default medias;

export const getMedia = (publicFolder, state, path) => {
  if (state.has(path)) {
    return state.get(path);
  }

  let localPath = path;
  if (path && path.indexOf('/') === -1) {
    localPath = `/${ publicFolder }/${ localPath }`;
  }
  return new MediaProxy(localPath, null, true);
};
