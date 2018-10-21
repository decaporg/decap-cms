import { List, Map } from 'immutable';
import { UPLOADCARE_ADD_FILE, UPLOADCARE_PERSIST, UPLOADCARE_LOAD } from './actions';

const defaultState = {
  files: List([]),
  dirty: false,
};

const reducer = (state = Map(defaultState), action) => {
  switch (action.type) {
    case UPLOADCARE_ADD_FILE:
      return state.withMutations(map => {
        map.update('files', files => files.push(action.payload.fileInfo));
        map.set('dirty', true);
      });
    case UPLOADCARE_PERSIST:
      return state.set('dirty', false);
    case UPLOADCARE_LOAD:
      return state.set('files', List(action.payload.files))
    default:
      return state;
  }
};

export default reducer;
