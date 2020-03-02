import { fromJS } from 'immutable';
import {
  ADD_ASSETS,
  ADD_ASSET,
  REMOVE_ASSET,
  LOAD_ASSET_REQUEST,
  LOAD_ASSET_SUCCESS,
  LOAD_ASSET_FAILURE,
} from '../actions/media';
import AssetProxy from '../valueObjects/AssetProxy';
import { Medias, MediasAction } from '../types/redux';

const medias = (state: Medias = fromJS({}), action: MediasAction) => {
  switch (action.type) {
    case ADD_ASSETS: {
      const payload = action.payload as AssetProxy[];
      let newState = state;
      payload.forEach(asset => {
        newState = newState.set(asset.path, { asset, isLoading: false, error: null });
      });
      return newState;
    }
    case ADD_ASSET: {
      const asset = action.payload as AssetProxy;
      return state.set(asset.path, { asset, isLoading: false, error: null });
    }
    case REMOVE_ASSET: {
      const payload = action.payload as string;
      return state.delete(payload);
    }
    case LOAD_ASSET_REQUEST: {
      const { path } = action.payload as { path: string };
      return state.set(path, { ...state.get(path), isLoading: true });
    }
    case LOAD_ASSET_SUCCESS: {
      const { path } = action.payload as { path: string };
      return state.set(path, { ...state.get(path), isLoading: false, error: null });
    }
    case LOAD_ASSET_FAILURE: {
      const { path, error } = action.payload as { path: string; error: Error };
      return state.set(path, { ...state.get(path), isLoading: false, error });
    }
    default:
      return state;
  }
};

export const selectIsLoadingAsset = (state: Medias) =>
  Object.values(state.toJS()).some(state => state.isLoading);

export default medias;
