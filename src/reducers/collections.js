import { OrderedMap, fromJS } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';
import { ENTRIES_REQUEST, ENTRIES_SUCCESS } from '../actions/entries';

export function collections(state = null, action) {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const collections = action.payload && action.payload.collections;
      return OrderedMap().withMutations((map) => {
        (collections || []).forEach(function(collection) {
          map.set(collection.name, fromJS(collection));
        });
      });
    case ENTRIES_REQUEST:
      return state && state.setIn([action.payload.collection, 'isFetching'], true);
    case ENTRIES_SUCCESS:
      return state && state.setIn([action.payload.collection, 'entries'], fromJS(action.payload.entries));
    default:
      return state;
  }
}
