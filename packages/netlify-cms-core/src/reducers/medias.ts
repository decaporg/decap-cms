import { fromJS } from 'immutable';
import { ADD_ASSETS, ADD_ASSET, REMOVE_ASSET } from '../actions/media';
import AssetProxy from '../valueObjects/AssetProxy';
import { Medias, MediasAction } from '../types/redux';

const medias = (state: Medias = fromJS({}), action: MediasAction) => {
  switch (action.type) {
    case ADD_ASSETS: {
      const payload = action.payload as AssetProxy[];
      let newState = state;
      payload.forEach(asset => {
        newState = newState.set(asset.path, asset);
      });
      return newState;
    }
    case ADD_ASSET: {
      const payload = action.payload as AssetProxy;
      return state.set(payload.path, payload);
    }
    case REMOVE_ASSET: {
      const payload = action.payload as string;
      return state.delete(payload);
    }
    default:
      return state;
  }
};

export default medias;
