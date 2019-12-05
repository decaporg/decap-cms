import { fromJS } from 'immutable';
import { basename } from 'path';
import { isAbsolutePath } from 'netlify-cms-lib-util';
import { ADD_ASSETS, ADD_ASSET, REMOVE_ASSET, addAsset } from '../actions/media';
import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { Medias, MediasAction, State, DisplayURLState, Collection } from '../types/redux';
import { AnyAction } from 'redux';
import { selectMediaFilePath } from './entries';
import {
  loadMediaDisplayURL,
  MEDIA_LOAD_SUCCESS,
  MEDIA_DISPLAY_URL_SUCCESS,
  MEDIA_DISPLAY_URL_FAILURE,
} from '../actions/mediaLibrary';
import { selectMediaFileByPath, selectMediaDisplayURL } from './mediaLibrary';
import { ThunkDispatch } from 'redux-thunk';
import { waitUntil } from '../actions/waitUntil';

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
  getState: () => State;
  dispatch: ThunkDispatch<State, {}, AnyAction>;
  collection: Collection;
  entryPath: string;
  path: string;
}

export const getAsset = async ({
  getState,
  dispatch,
  collection,
  entryPath,
  path,
}: GetAssetArgs) => {
  // No path provided, skip
  if (!path) return null;

  let asset = getState().medias.get(path);
  if (asset) {
    // There is already an AssetProxy in memory for this url. Use it.
    return asset;
  }

  // Create a new AssetProxy (for consistency) and return it.
  if (isAbsolutePath(path)) {
    asset = createAssetProxy({ path, url: path });
  } else {
    // load asset url from backend based on the public path
    const resolvedPath = selectMediaFilePath(
      getState().config,
      collection,
      entryPath,
      basename(path),
    );

    // check if this is a draft entry media file
    let file = getState()
      .entryDraft.get('mediaFiles')
      .find(file => file?.path === resolvedPath);

    if (!file) {
      // wait until media library is loaded
      if (getState().mediaLibrary.get('isLoading') === false) {
        file = selectMediaFileByPath(getState().mediaLibrary, resolvedPath);
      } else {
        file = await new Promise(resolve => {
          dispatch(
            waitUntil({
              predicate: ({ type }) => type === MEDIA_LOAD_SUCCESS,
              run: () => resolve(selectMediaFileByPath(getState().mediaLibrary, resolvedPath)),
            }),
          );
        });
      }
    }

    if (file) {
      const displayURLState: DisplayURLState = selectMediaDisplayURL(
        getState().mediaLibrary,
        file.id,
      );

      if (displayURLState.get('url')) {
        // url was already loaded
        asset = createAssetProxy({ path, url: displayURLState.get('url') });
      } else if (displayURLState.get('err')) {
        // url loading had an error
        asset = createAssetProxy({ path, url: resolvedPath });
      } else {
        if (!displayURLState.get('isFetching')) {
          // load display url
          dispatch(loadMediaDisplayURL(file));
        }
        const url: string = await new Promise(resolve => {
          dispatch(
            waitUntil({
              predicate: ({ type, payload }) =>
                (type === MEDIA_DISPLAY_URL_SUCCESS || type === MEDIA_DISPLAY_URL_FAILURE) &&
                payload.key === file.id,
              run: (_dispatch, _getState, action) => resolve(action.payload.url),
            }),
          );
        });
        asset = createAssetProxy({ path, url });
      }
    } else {
      asset = createAssetProxy({ path, url: resolvedPath });
    }
  }

  dispatch(addAsset(asset));

  return asset;
};
