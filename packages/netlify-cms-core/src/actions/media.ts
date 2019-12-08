import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { Collection, State, MediaFile, DisplayURLState } from '../types/redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction, Dispatch } from 'redux';
import { isAbsolutePath } from 'netlify-cms-lib-util';
import { selectMediaFilePath } from '../reducers/entries';
import { selectMediaDisplayURL, selectMediaFileByPath } from '../reducers/mediaLibrary';
import { waitUntil } from './waitUntil';
import {
  MEDIA_LOAD_SUCCESS,
  loadMediaDisplayURL,
  MEDIA_DISPLAY_URL_SUCCESS,
  MEDIA_DISPLAY_URL_FAILURE,
  getMediaFile,
} from './mediaLibrary';

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

const waitUntilWithTimeout = async <T>(waitPromise: Promise<T>): Promise<T | null> => {
  let waitDone = false;

  const timeoutPromise = new Promise<T>((resolve, reject) => {
    setTimeout(() => (waitDone ? resolve() : reject(new Error('Wait Action timed out'))), 15000);
  });

  const result = await Promise.race([
    waitPromise.then(result => {
      waitDone = true;
      return result;
    }),
    timeoutPromise,
  ]).catch(null);

  return result;
};

interface GetAssetArgs {
  collection: Collection;
  entryPath: string;
  path: string;
}

export function getAsset({ collection, entryPath, path }: GetAssetArgs) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    // No path provided, skip
    if (!path) return null;

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
      // load asset url from backend based on the media folder

      // check if this is a draft entry media file
      let file: MediaFile | null = state.entryDraft
        .get('mediaFiles')
        ?.find(file => file?.path === resolvedPath);

      if (!file) {
        // wait until media library is loaded
        if (state.mediaLibrary.get('isLoading') === false) {
          file = selectMediaFileByPath(state.mediaLibrary, resolvedPath);
        } else {
          file = await waitUntilWithTimeout(
            new Promise(resolve => {
              dispatch(
                waitUntil({
                  predicate: ({ type }) => type === MEDIA_LOAD_SUCCESS,
                  run: (_dispatch: Dispatch, getState: () => State) =>
                    resolve(selectMediaFileByPath(getState().mediaLibrary, resolvedPath)),
                }),
              );
            }),
          );
        }
      }

      if (file) {
        const displayURLState: DisplayURLState = selectMediaDisplayURL(
          getState().mediaLibrary,
          file.id,
        );

        if (displayURLState.get('url')) {
          // url was already loaded
          asset = createAssetProxy({ path: resolvedPath, url: displayURLState.get('url') });
        } else if (displayURLState.get('err')) {
          // url loading had an error
          asset = createAssetProxy({ path: resolvedPath, url: resolvedPath });
        } else {
          if (!displayURLState.get('isFetching')) {
            // load display url
            dispatch(loadMediaDisplayURL(file));
          }

          const key = file.id;
          const url = await waitUntilWithTimeout(
            new Promise<string>(resolve => {
              dispatch(
                waitUntil({
                  predicate: ({ type, payload }) =>
                    (type === MEDIA_DISPLAY_URL_SUCCESS || type === MEDIA_DISPLAY_URL_FAILURE) &&
                    payload.key === key,
                  run: (_dispatch, _getState, action) => resolve(action.payload.url),
                }),
              );
            }),
          );

          asset = createAssetProxy({ path: resolvedPath, url: url || '' });
        }
      } else {
        file = await getMediaFile(state, resolvedPath);
        asset = createAssetProxy({ path: resolvedPath, url: file.url });
      }
    }

    dispatch(addAsset(asset));

    return asset;
  };
}
