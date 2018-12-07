import { OrderedMap, Map } from 'immutable';
import {
  UPLOADCARE_ADD_FILES,
  UPLOADCARE_FLUSH,
  UPLOADCARE_LOAD,
  UPLOADCARE_REMOVE_FILES,
} from './actions';

const defaultState = {
  files: OrderedMap(),
  dirty: false,
};

const reducer = (state = Map(defaultState), action) => {
  switch (action.type) {
    case UPLOADCARE_ADD_FILES:
      return state.withMutations(map => {
        action.payload.forEach(fileInfo => {
          if(map.get('files').has(fileInfo.uuid)) {
            return
          }

          map.set('dirty', true);
          map.update('files', files => files.set(fileInfo.uuid, fileInfo));
        })
      });
    case UPLOADCARE_FLUSH:
      return state.set('dirty', false);
    case UPLOADCARE_LOAD:
      return state.set('files', OrderedMap(action.payload.files));
    case UPLOADCARE_REMOVE_FILES:
      return state.set(
        'files',
        state.get('files').filter(fileInfo => !action.payload.uuids.includes(fileInfo.uuid)),
      );
    default:
      return state;
  }
};

export default reducer;
