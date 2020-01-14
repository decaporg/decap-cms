import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { Collection, State } from '../types/redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { isAbsolutePath } from 'netlify-cms-lib-util';
import { selectMediaFilePath } from '../reducers/entries';
import { selectMediaFileByPath } from '../reducers/mediaLibrary';
import { getMediaFile, waitForMediaLibraryToLoad, getMediaDisplayURL } from './mediaLibrary';

export const ADD_ASSETS = 'ADD_ASSETS';
export const ADD_ASSET = 'ADD_ASSET';
export const REMOVE_ASSET = 'REMOVE_ASSET';

export function addAssets(assets: AssetProxy[]) {
  return { type: ADD_ASSETS, payload: assets };
}

export function addAsset(assetProxy: AssetProxy) {
  return { type: ADD_ASSET, payload: assetProxy };
}

export function removeAsset(path: string) {
  return { type: REMOVE_ASSET, payload: path };
}

interface GetAssetArgs {
  collection: Collection;
  entryPath: string;
  path: string;
}

export function getAsset({ collection, entryPath, path }: GetAssetArgs) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (!path) return createAssetProxy({ path: '', file: new File([], 'empty') });

    const state = getState();
    const resolvedPath = selectMediaFilePath(state.config, collection, entryPath, path);

    let asset = state.medias.get(resolvedPath);
    if (asset) {
      // There is already an AssetProxy in memory for this path. Use it.
      return asset;
    }

    // Create a new AssetProxy (for consistency) and return it.
    if (isAbsolutePath(resolvedPath)) {
      // asset path is a public url so we can just use it as is
      asset = createAssetProxy({ path: resolvedPath, url: path });
    } else {
      // load asset url from backend
      await waitForMediaLibraryToLoad(dispatch, getState());
      const file = selectMediaFileByPath(state, resolvedPath);

      if (file) {
        const url = await getMediaDisplayURL(dispatch, getState(), file);
        asset = createAssetProxy({ path: resolvedPath, url: url || resolvedPath });
      } else {
        const { url } = await getMediaFile(state, resolvedPath);
        asset = createAssetProxy({ path: resolvedPath, url });
      }
    }

    dispatch(addAsset(asset));

    return asset;
  };
}
