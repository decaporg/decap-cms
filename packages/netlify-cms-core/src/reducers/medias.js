import { Map } from 'immutable';
import { resolvePath } from 'netlify-cms-lib-util';
import { ADD_ASSET, REMOVE_ASSET } from 'Actions/media';
import AssetProxy from 'ValueObjects/AssetProxy';

const medias = (state = Map(), action) => {
  switch (action.type) {
    case ADD_ASSET:
      return state.set(action.payload.public_path, action.payload);
    case REMOVE_ASSET:
      return state.delete(action.payload);

    default:
      return state;
  }
};

export default medias;

const memoizedProxies = {};
export const getAsset = (publicFolder, state, path) => {
  // No path provided, skip
  if (!path) return null;

  let proxy = state.get(path) || memoizedProxies[path];
  if (proxy) {
    // There is already an AssetProxy in memory for this path. Use it.
    return proxy;
  }

  // Create a new AssetProxy (for consistency) and return it.
  proxy = memoizedProxies[path] = new AssetProxy(resolvePath(path, publicFolder), null, true);
  return proxy;
};
