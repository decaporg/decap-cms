import { isAbsolutePath } from 'decap-cms-lib-util';

import { createAssetProxy } from '../valueObjects/AssetProxy';
import { selectMediaFilePath } from '../reducers/entries';
import { selectMediaFileByPath } from '../reducers/mediaLibrary';
import { getMediaFile, waitForMediaLibraryToLoad, getMediaDisplayURL } from './mediaLibrary';

import type AssetProxy from '../valueObjects/AssetProxy';
import type { Collection, State, EntryMap, EntryField } from '../types/redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';

export const ADD_ASSETS = 'ADD_ASSETS';
export const ADD_ASSET = 'ADD_ASSET';
export const REMOVE_ASSET = 'REMOVE_ASSET';

export const LOAD_ASSET_REQUEST = 'LOAD_ASSET_REQUEST';
export const LOAD_ASSET_SUCCESS = 'LOAD_ASSET_SUCCESS';
export const LOAD_ASSET_FAILURE = 'LOAD_ASSET_FAILURE';

export function addAssets(assets: AssetProxy[]) {
  return { type: ADD_ASSETS, payload: assets } as const;
}

export function addAsset(assetProxy: AssetProxy) {
  return { type: ADD_ASSET, payload: assetProxy } as const;
}

export function removeAsset(path: string) {
  return { type: REMOVE_ASSET, payload: path } as const;
}

export function loadAssetRequest(path: string) {
  return { type: LOAD_ASSET_REQUEST, payload: { path } } as const;
}

export function loadAssetSuccess(path: string) {
  return { type: LOAD_ASSET_SUCCESS, payload: { path } } as const;
}

export function loadAssetFailure(path: string, error: Error) {
  return { type: LOAD_ASSET_FAILURE, payload: { path, error } } as const;
}

export function loadAsset(resolvedPath: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      dispatch(loadAssetRequest(resolvedPath));
      // load asset url from backend
      await waitForMediaLibraryToLoad(dispatch, getState());
      const file = selectMediaFileByPath(getState(), resolvedPath);

      if (file) {
        const url = await getMediaDisplayURL(dispatch, getState(), file);
        const asset = createAssetProxy({ path: resolvedPath, url: url || resolvedPath });
        dispatch(addAsset(asset));
      } else {
        const { url } = await getMediaFile(getState(), resolvedPath);
        const asset = createAssetProxy({ path: resolvedPath, url });
        dispatch(addAsset(asset));
      }
      dispatch(loadAssetSuccess(resolvedPath));
    } catch (e) {
      dispatch(loadAssetFailure(resolvedPath, e));
    }
  };
}

interface GetAssetArgs {
  collection: Collection;
  entry: EntryMap;
  path: string;
  field?: EntryField;
}

const emptyAsset = createAssetProxy({
  path: 'empty.svg',
  file: new File([`<svg xmlns="http://www.w3.org/2000/svg"></svg>`], 'empty.svg', {
    type: 'image/svg+xml',
  }),
});

export function boundGetAsset(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  collection: Collection,
  entry: EntryMap,
) {
  function bound(path: string, field: EntryField) {
    const asset = dispatch(getAsset({ collection, entry, path, field }));
    return asset;
  }

  return bound;
}

export function getAsset({ collection, entry, path, field }: GetAssetArgs) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (!path) return emptyAsset;

    const state = getState();
    const resolvedPath = selectMediaFilePath(state.config, collection, entry, path, field);

    let { asset, isLoading, error } = state.medias[resolvedPath] || {};
    if (isLoading) {
      return emptyAsset;
    }

    if (asset) {
      // There is already an AssetProxy in memory for this path. Use it.
      return asset;
    }

    if (isAbsolutePath(resolvedPath)) {
      // asset path is a public url so we can just use it as is
      asset = createAssetProxy({ path: resolvedPath, url: path });
      dispatch(addAsset(asset));
    } else {
      if (error) {
        // on load error default back to original path
        asset = createAssetProxy({ path: resolvedPath, url: path });
        dispatch(addAsset(asset));
      } else {
        dispatch(loadAsset(resolvedPath));
        asset = emptyAsset;
      }
    }

    return asset;
  };
}

export type MediasAction = ReturnType<
  | typeof addAssets
  | typeof addAsset
  | typeof removeAsset
  | typeof loadAssetRequest
  | typeof loadAssetSuccess
  | typeof loadAssetFailure
>;
