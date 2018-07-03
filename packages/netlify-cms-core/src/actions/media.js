export const ADD_ASSET = 'ADD_ASSET';
export const REMOVE_ASSET = 'REMOVE_ASSET';

export function addAsset(assetProxy) {
  return { type: ADD_ASSET, payload: assetProxy };
}

export function removeAsset(path) {
  return { type: REMOVE_ASSET, payload: path };
}
