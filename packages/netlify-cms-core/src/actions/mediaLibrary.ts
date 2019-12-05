import { Map } from 'immutable';
import { actions as notifActions } from 'redux-notifications';
import { getBlobSHA } from 'netlify-cms-lib-util';
import { currentBackend } from '../backend';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { selectIntegration } from '../reducers';
import { selectMediaFilePath } from '../reducers/entries';
import { selectMediaDisplayURL } from '../reducers/mediaLibrary';
import { getIntegrationProvider } from '../integrations';
import { addAsset, removeAsset } from './media';
import { addDraftEntryMediaFile, removeDraftEntryMediaFile } from './entries';
import { sanitizeSlug } from '../lib/urlHelper';
import { waitUntil } from './waitUntil';
import { State, MediaFile, DisplayURLState } from '../types/redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { MediaLibraryInstance } from '../mediaLibrary';

const { notifSend } = notifActions;

export const MEDIA_LIBRARY_OPEN = 'MEDIA_LIBRARY_OPEN';
export const MEDIA_LIBRARY_CLOSE = 'MEDIA_LIBRARY_CLOSE';
export const MEDIA_LIBRARY_CREATE = 'MEDIA_LIBRARY_CREATE';
export const MEDIA_INSERT = 'MEDIA_INSERT';
export const MEDIA_REMOVE_INSERTED = 'MEDIA_REMOVE_INSERTED';
export const MEDIA_LOAD_REQUEST = 'MEDIA_LOAD_REQUEST';
export const MEDIA_LOAD_SUCCESS = 'MEDIA_LOAD_SUCCESS';
export const MEDIA_LOAD_FAILURE = 'MEDIA_LOAD_FAILURE';
export const MEDIA_PERSIST_REQUEST = 'MEDIA_PERSIST_REQUEST';
export const MEDIA_PERSIST_SUCCESS = 'MEDIA_PERSIST_SUCCESS';
export const MEDIA_PERSIST_FAILURE = 'MEDIA_PERSIST_FAILURE';
export const MEDIA_DELETE_REQUEST = 'MEDIA_DELETE_REQUEST';
export const MEDIA_DELETE_SUCCESS = 'MEDIA_DELETE_SUCCESS';
export const MEDIA_DELETE_FAILURE = 'MEDIA_DELETE_FAILURE';
export const MEDIA_DISPLAY_URL_REQUEST = 'MEDIA_DISPLAY_URL_REQUEST';
export const MEDIA_DISPLAY_URL_SUCCESS = 'MEDIA_DISPLAY_URL_SUCCESS';
export const MEDIA_DISPLAY_URL_FAILURE = 'MEDIA_DISPLAY_URL_FAILURE';
export const ADD_MEDIA_FILES_TO_LIBRARY = 'ADD_MEDIA_FILES_TO_LIBRARY';

export function createMediaLibrary(instance: MediaLibraryInstance) {
  const api = {
    show: instance.show || (() => {}),
    hide: instance.hide || (() => {}),
    onClearControl: instance.onClearControl || (() => {}),
    onRemoveControl: instance.onRemoveControl || (() => {}),
    enableStandalone: instance.enableStandalone || (() => {}),
  };
  return { type: MEDIA_LIBRARY_CREATE, payload: api };
}

export function clearMediaControl(id: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.onClearControl({ id });
    }
  };
}

export function removeMediaControl(id: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.onRemoveControl({ id });
    }
  };
}

export function openMediaLibrary(
  payload: {
    controlID?: string;
    value?: string;
    config?: Map<string, unknown>;
    allowMultiple?: boolean;
    forImage?: boolean;
  } = {},
) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      const { controlID: id, value, config = Map(), allowMultiple, forImage } = payload;
      mediaLibrary.show({ id, value, config: config.toJS(), allowMultiple, imagesOnly: forImage });
    }
    dispatch({ type: MEDIA_LIBRARY_OPEN, payload });
  };
}

export function closeMediaLibrary() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.hide();
    }
    dispatch({ type: MEDIA_LIBRARY_CLOSE });
  };
}

export function insertMedia(mediaPath: string | string[]) {
  return { type: MEDIA_INSERT, payload: { mediaPath } };
}

export function removeInsertedMedia(controlID: string) {
  return { type: MEDIA_REMOVE_INSERTED, payload: { controlID } };
}

export function loadMedia(
  opts: { delay?: number; query?: string; page?: number; privateUpload?: boolean } = {},
) {
  const { delay = 0, query = '', page = 1, privateUpload } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    if (integration) {
      const provider = getIntegrationProvider(state.integrations, backend.getToken, integration);
      dispatch(mediaLoading(page));
      try {
        const files = await provider.retrieve(query, page, privateUpload);
        const mediaLoadedOpts = {
          page,
          canPaginate: true,
          dynamicSearch: true,
          dynamicSearchQuery: query,
          privateUpload,
        };
        return dispatch(mediaLoaded(files, mediaLoadedOpts));
      } catch (error) {
        return dispatch(mediaLoadFailed({ privateUpload }));
      }
    }
    dispatch(mediaLoading(page));
    return new Promise(resolve => {
      setTimeout(
        () =>
          resolve(
            backend
              .getMedia()
              .then((files: MediaFile[]) => dispatch(mediaLoaded(files)))
              .catch((error: { status?: number }) => {
                console.error(error);
                if (error.status === 404) {
                  console.log('This 404 was expected and handled appropriately.');
                  dispatch(mediaLoaded([]));
                } else {
                  dispatch(mediaLoadFailed());
                }
              }),
          ),
        delay,
      );
    });
  };
}

function createMediaFileFromAsset({
  id,
  file,
  assetProxy,
  draft,
}: {
  id: string;
  file: File;
  assetProxy: AssetProxy;
  draft: boolean;
}): MediaFile {
  const mediaFile = {
    id,
    name: file.name,
    displayURL: assetProxy.url,
    draft,
    size: file.size,
    url: assetProxy.url,
    path: assetProxy.path,
  };
  return mediaFile;
}

export function persistMedia(file: File, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    const files = state.mediaLibrary.get('files');
    const fileName = sanitizeSlug(file.name.toLowerCase(), state.config.get('slug'));
    const existingFile = files.find(existingFile => existingFile.name.toLowerCase() === fileName);

    const entry = state.entryDraft.get('entry');
    const useWorkflow = state.config.get('publish_mode') === EDITORIAL_WORKFLOW;
    const draft = entry && !entry.isEmpty() && useWorkflow;

    /**
     * Check for existing files of the same name before persisting. If no asset
     * store integration is used, files are being stored in Git, so we can
     * expect file names to be unique. If an asset store is in use, file names
     * may not be unique, so we forego this check.
     */
    if (!integration && existingFile) {
      if (!window.confirm(`${existingFile.name} already exists. Do you want to replace it?`)) {
        return;
      } else {
        await dispatch(deleteMedia(existingFile, { privateUpload }));
      }
    }

    dispatch(mediaPersisting());

    try {
      const id = await getBlobSHA(file);
      let assetProxy: AssetProxy;
      if (integration) {
        try {
          const provider = getIntegrationProvider(
            state.integrations,
            backend.getToken,
            integration,
          );
          const response = await provider.upload(file, privateUpload);
          assetProxy = createAssetProxy({
            url: response.asset.url,
            path: response.asset.url,
          });
        } catch (error) {
          assetProxy = createAssetProxy({
            file,
            path: file.name,
          });
        }
      } else if (privateUpload) {
        throw new Error('The Private Upload option is only available for Asset Store Integration');
      } else {
        const entryPath = entry && entry.get('path');
        const collection = entry && state.collections.get(entry.get('collection'));
        const path = selectMediaFilePath(state.config, collection, entryPath, file.name);
        assetProxy = createAssetProxy({
          file,
          path,
        });
      }

      dispatch(addAsset(assetProxy));

      let mediaFile: MediaFile;
      if (integration) {
        mediaFile = createMediaFileFromAsset({ id, file, assetProxy, draft });
      } else if (draft) {
        mediaFile = createMediaFileFromAsset({ id, file, assetProxy, draft });
        dispatch(addDraftEntryMediaFile(mediaFile));
      } else {
        mediaFile = await backend.persistMedia(state.config, assetProxy);
      }

      return dispatch(mediaPersisted(mediaFile, { privateUpload }));
    } catch (error) {
      console.error(error);
      dispatch(
        notifSend({
          message: `Failed to persist media: ${error}`,
          kind: 'danger',
          dismissAfter: 8000,
        }),
      );
      return dispatch(mediaPersistFailed({ privateUpload }));
    }
  };
}

export function deleteMedia(file: MediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    if (integration) {
      const provider = getIntegrationProvider(state.integrations, backend.getToken, integration);
      dispatch(mediaDeleting());

      try {
        await provider.delete(file.id);
        return dispatch(mediaDeleted(file, { privateUpload }));
      } catch (error) {
        console.error(error);
        dispatch(
          notifSend({
            message: `Failed to delete media: ${error.message}`,
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        return dispatch(mediaDeleteFailed({ privateUpload }));
      }
    }
    dispatch(mediaDeleting());

    try {
      dispatch(removeAsset(file.url as string));
      dispatch(removeDraftEntryMediaFile({ id: file.id }));

      if (!file.draft) {
        await backend.deleteMedia(state.config, file.path);
      }

      return dispatch(mediaDeleted(file));
    } catch (error) {
      console.error(error);
      dispatch(
        notifSend({
          message: `Failed to delete media: ${error.message}`,
          kind: 'danger',
          dismissAfter: 8000,
        }),
      );
      return dispatch(mediaDeleteFailed());
    }
  };
}

export function loadMediaDisplayURL(file: MediaFile) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const { displayURL, id } = file;
    const state = getState();
    const displayURLState: DisplayURLState = selectMediaDisplayURL(state.mediaLibrary, id);
    if (
      !id ||
      !displayURL ||
      displayURLState.get('url') ||
      displayURLState.get('isFetching') ||
      displayURLState.get('err')
    ) {
      return Promise.resolve();
    }
    if (typeof displayURL === 'string') {
      dispatch(mediaDisplayURLRequest(id));
      dispatch(mediaDisplayURLSuccess(id, displayURL));
      return;
    }
    try {
      const backend = currentBackend(state.config);
      dispatch(mediaDisplayURLRequest(id));
      const newURL = await backend.getMediaDisplayURL(displayURL);
      if (newURL) {
        dispatch(mediaDisplayURLSuccess(id, newURL));
      } else {
        throw new Error('No display URL was returned!');
      }
    } catch (err) {
      dispatch(mediaDisplayURLFailure(id, err));
    }
  };
}

export function mediaLoading(page: number) {
  return {
    type: MEDIA_LOAD_REQUEST,
    payload: { page },
  };
}

interface MediaOptions {
  privateUpload?: boolean;
}

export function mediaLoaded(files: MediaFile[], opts: MediaOptions = {}) {
  return {
    type: MEDIA_LOAD_SUCCESS,
    payload: { files, ...opts },
  };
}

export function mediaLoadFailed(opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_LOAD_FAILURE, payload: { privateUpload } };
}

export function mediaPersisting() {
  return { type: MEDIA_PERSIST_REQUEST };
}

export function mediaPersisted(asset: MediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_PERSIST_SUCCESS,
    payload: { file: asset, privateUpload },
  };
}

export function addMediaFilesToLibrary(mediaFiles: MediaFile[]) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const action = {
      type: ADD_MEDIA_FILES_TO_LIBRARY,
      payload: { mediaFiles },
    };
    // add media files to library only after the library finished loading
    if (state.mediaLibrary.get('isLoading') === false) {
      dispatch(action);
    } else {
      dispatch(
        waitUntil({
          predicate: ({ type }) => type === MEDIA_LOAD_SUCCESS,
          run: dispatch => dispatch(action),
        }),
      );
    }
  };
}

export function mediaPersistFailed(opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_PERSIST_FAILURE, payload: { privateUpload } };
}

export function mediaDeleting() {
  return { type: MEDIA_DELETE_REQUEST };
}

export function mediaDeleted(file: MediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_DELETE_SUCCESS,
    payload: { file, privateUpload },
  };
}

export function mediaDeleteFailed(opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_DELETE_FAILURE, payload: { privateUpload } };
}

export function mediaDisplayURLRequest(key: string) {
  return { type: MEDIA_DISPLAY_URL_REQUEST, payload: { key } };
}

export function mediaDisplayURLSuccess(key: string, url: string) {
  return {
    type: MEDIA_DISPLAY_URL_SUCCESS,
    payload: { key, url },
  };
}

export function mediaDisplayURLFailure(key: string, err: Error) {
  console.error(err);
  return {
    type: MEDIA_DISPLAY_URL_FAILURE,
    payload: { key, err },
  };
}
