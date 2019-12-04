import { fromJS } from 'immutable';
import { ADD_ASSETS, ADD_ASSET, REMOVE_ASSET, addAsset } from '../actions/media';
import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { Medias, MediasAction } from '../types/redux';
import { Dispatch } from 'redux';

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

export interface GetAssetArgs {
  state: Medias;
  dispatch: Dispatch;
  path: string;
}

export const getAsset = ({ state, dispatch, path }: GetAssetArgs) => {
  // No path provided, skip
  if (!path) return null;

  let asset = state.get(path);
  if (asset) {
    // There is already an AssetProxy in memory for this url. Use it.
    return asset;
  }

  // Create a new AssetProxy (for consistency) and return it.
  asset = createAssetProxy({ path, file: new File([], 'fake.png') });
  dispatch(addAsset(asset));

  return asset;
};
