export const ADD_ASSETS = 'ADD_ASSETS';
export const ADD_ASSET = 'ADD_ASSET';
export const REMOVE_ASSET = 'REMOVE_ASSET';

export function addAssets(assets) {
  return { type: ADD_ASSETS, payload: assets };
}

export function addAsset(assetProxy) {
  return { type: ADD_ASSET, payload: assetProxy };
}

export function removeAsset(path) {
  return { type: REMOVE_ASSET, payload: path };
}
