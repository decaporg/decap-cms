import Immutable from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';

export function collections(state = null, action) {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const collections = action.payload && action.payload.collections;
      return Immutable.OrderedMap().withMutations((map) => {
        (collections || []).forEach(function(collection) {
          map.set(collection.name, Immutable.fromJS(collection));
        });
      });
    default:
      return state;
  }
}
