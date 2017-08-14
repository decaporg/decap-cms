import { Map } from 'immutable';
import { OPEN_MEDIA_LIBRARY, CLOSE_MEDIA_LIBRARY } from '../actions/mediaLibrary';

const mediaLibrary = (state = Map({ isVisible: false }), action) => {
  switch (action.type) {
    case OPEN_MEDIA_LIBRARY:
      return state.set('isVisible', true);
    case CLOSE_MEDIA_LIBRARY:
      return state.set('isVisible', false);
    default:
      return state;
  }
};

export default mediaLibrary;
