import { OrderedMap, fromJS } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';

const collectionsReducer = (state = null, action) => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const collections = action.payload && action.payload.collections;
      return OrderedMap().withMutations((map) => {
        (collections || []).forEach((collection) => {
          map.set(collection.name, fromJS(collection));
        });
      });
    }
    default:
      return state;
  }
};

export default collectionsReducer;
