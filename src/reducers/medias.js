import { Map } from 'immutable';
import { resolvePath } from '../lib/pathHelper';
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
  // No path provided, skip
  if (!path) return null;

  if (state.has(path)) {
    // There is already a MediaProxy in memmory for this path. Use it.
    return state.get(path);
  }

  // Create a new MediaProxy (for consistency) and return it.
  return new MediaProxy(resolvePath(path, publicFolder), null, true);
};
