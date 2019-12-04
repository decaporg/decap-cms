import { fromJS } from 'immutable';
import { basename } from 'path';
import { isAbsolutePath } from 'netlify-cms-lib-util';
import { ADD_ASSETS, ADD_ASSET, REMOVE_ASSET, addAsset } from '../actions/media';
import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { Medias, MediasAction, State, MediaFile } from '../types/redux';
import { AnyAction } from 'redux';
import { selectMediaFilePath } from './entries';
import {
  loadMediaDisplayURL,
  MEDIA_LOAD_SUCCESS,
  MEDIA_DISPLAY_URL_SUCCESS,
  MEDIA_DISPLAY_URL_FAILURE,
} from '../actions/mediaLibrary';
import { selectMediaFileByPath } from './mediaLibrary';
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
  path: string;
}

export const getAsset = async ({ getState, dispatch, path }: GetAssetArgs) => {
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
    const resolvedPath = selectMediaFilePath(getState().config, null, '', basename(path));
    // wait until media library is loaded
    let file: MediaFile;
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

    // load display url
    dispatch(loadMediaDisplayURL(file));
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

  dispatch(addAsset(asset));

  return asset;
};
