import { OrderedMap, Map } from 'immutable';
import {
  UPLOADCARE_ADD_FILE,
  UPLOADCARE_FLUSH,
  UPLOADCARE_LOAD,
  UPLOADCARE_REMOVE_FILE,
} from './actions';

const defaultState = {
  files: OrderedMap(),
  dirty: false,
};

const reducer = (state = Map(defaultState), action) => {
  switch (action.type) {
    case UPLOADCARE_ADD_FILE:
      return state.withMutations(map => {
        map.update('files', files => files.set(action.payload.uuid, action.payload.fileInfo));
        map.set('dirty', true);
      });
    case UPLOADCARE_FLUSH:
      return state.set('dirty', false);
    case UPLOADCARE_LOAD:
      return state.set('files', OrderedMap(action.payload.files));
    case UPLOADCARE_REMOVE_FILE:
      return state.set('files', state.get('files').remove(action.payload.uuid));
    default:
      return state;
  }
};

export default reducer;
