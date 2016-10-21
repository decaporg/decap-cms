import { OrderedMap, fromJS } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';
import { FILES, FOLDER } from '../constants/collectionTypes';

const hasProperty = (config, property) => ({}.hasOwnProperty.call(config, property));

const collections = (state = null, action) => {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const configCollections = action.payload && action.payload.collections;
      return OrderedMap().withMutations((map) => {
        (configCollections || []).forEach((configCollection) => {
          if (hasProperty(configCollection, 'folder')) {
            configCollection.type = FOLDER; // eslint-disable-line no-param-reassign
          } else if (hasProperty(configCollection, 'files')) {
            configCollection.type = FILES; // eslint-disable-line no-param-reassign
          }
          map.set(configCollection.name, fromJS(configCollection));
        });
      });
    default:
      return state;
  }
};

export default collections;
