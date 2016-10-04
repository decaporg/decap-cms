import { OrderedMap, fromJS } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';

const collections = (state = null, action) => {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const collections = action.payload && action.payload.collections;
      return OrderedMap().withMutations((map) => {
        (collections || []).forEach(function(collection) {
          map.set(collection.name, fromJS(collection));
        });
      });
    default:
      return state;
  }
};

export const selectCollection = (state, name) => (
  state.getIn(['collections', name])
);

export default collections;
