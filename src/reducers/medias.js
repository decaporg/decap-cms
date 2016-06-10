import { Map } from 'immutable';
import { ADD_MEDIA } from '../actions/media';
import MediaProxy from '../valueObjects/MediaProxy';

const medias = (state = Map(), action) => {
  switch (action.type) {
    case ADD_MEDIA:
      return state.set(action.payload.name, action.payload);
    default:
      return state;
  }
};

export default medias;

export const getMedia = (state, filePath) => {
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
  if (state.has(fileName)) {
    return new MediaProxy(fileName, window.URL.createObjectURL(state.get(fileName), {oneTimeOnly: true}));
  } else {
    return new MediaProxy(filePath, null, filePath, true);
  }
};
