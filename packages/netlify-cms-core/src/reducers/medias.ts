import { Map } from 'immutable';
import { resolvePath } from 'netlify-cms-lib-util';
import { ADD_ASSETS, ADD_ASSET, REMOVE_ASSET } from '../actions/media';
import AssetProxy from '../valueObjects/AssetProxy';
import { Medias, MediasAction, MediaAsset } from '../types/redux';

const medias = (state: Medias = Map(), action: MediasAction) => {
  switch (action.type) {
    case ADD_ASSETS: {
      const payload = action.payload as MediaAsset[];
      let newState = state;
      payload.forEach(asset => {
        newState = newState.set(asset.public_path, asset);
      });
      return newState;
    }
    case ADD_ASSET: {
      const payload = action.payload as MediaAsset;
      return state.set(payload.public_path, payload);
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

const memoizedProxies: Record<string, AssetProxy | undefined> = {};

export interface GetAssetArgs {
  state: Medias;
  path: string;
  publicFolder: string;
  mediaFolder: string;
}

export const getAsset = ({ state, path, publicFolder, mediaFolder }: GetAssetArgs) => {
  // No path provided, skip
  if (!path) return null;

  let proxy = state.get(path) || memoizedProxies[path];
  if (proxy) {
    // There is already an AssetProxy in memory for this path. Use it.
    return proxy;
  }

  // Create a new AssetProxy (for consistency) and return it.
  proxy = memoizedProxies[path] = new AssetProxy({
    publicFolder,
    mediaFolder,
    value: resolvePath(path, publicFolder),
    fileObj: null,
    uploaded: true,
  });
  return proxy;
};
