import { Map } from 'immutable';
import { actions as notifActions } from 'redux-notifications';
import { basename, getBlobSHA, ImplementationMediaFile } from 'netlify-cms-lib-util';
import { currentBackend } from '../backend';
import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import { selectIntegration } from '../reducers';
import {
  selectMediaFilePath,
  selectMediaFilePublicPath,
  selectEditingDraft,
} from '../reducers/entries';
import { selectMediaDisplayURL, selectMediaFiles } from '../reducers/mediaLibrary';
import { getIntegrationProvider } from '../integrations';
import { addAsset, removeAsset } from './media';
import { addDraftEntryMediaFile, removeDraftEntryMediaFile } from './entries';
import { sanitizeSlug } from '../lib/urlHelper';
import {
  State,
  MediaFile,
  DisplayURLState,
  MediaLibraryInstance,
  EntryField,
} from '../types/redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { waitUntilWithTimeout } from './waitUntil';

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

export function createMediaLibrary(instance: MediaLibraryInstance) {
  const api = {
    show: instance.show || (() => undefined),
    hide: instance.hide || (() => undefined),
    onClearControl: instance.onClearControl || (() => undefined),
    onRemoveControl: instance.onRemoveControl || (() => undefined),
    enableStandalone: instance.enableStandalone || (() => undefined),
  };
  return { type: MEDIA_LIBRARY_CREATE, payload: api };
}

export function clearMediaControl(id: string) {
  return (_dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.onClearControl({ id });
    }
  };
}

export function removeMediaControl(id: string) {
  return (_dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
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
    mediaFolder?: string;
    publicFolder?: string;
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

export function insertMedia(mediaPath: string | string[], field: EntryField | undefined) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const config = state.config;
    const entry = state.entryDraft.get('entry');
    const collectionName = state.entryDraft.getIn(['entry', 'collection']);
    const collection = state.collections.get(collectionName);
    if (Array.isArray(mediaPath)) {
      mediaPath = mediaPath.map(path =>
        selectMediaFilePublicPath(config, collection, path, entry, field),
      );
    } else {
      mediaPath = selectMediaFilePublicPath(config, collection, mediaPath as string, entry, field);
    }
    dispatch({ type: MEDIA_INSERT, payload: { mediaPath } });
  };
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

    const loadFunction = () =>
      backend
        .getMedia()
        .then(files => dispatch(mediaLoaded(files)))
        .catch((error: { status?: number }) => {
          console.error(error);
          if (error.status === 404) {
            console.log('This 404 was expected and handled appropriately.');
            dispatch(mediaLoaded([]));
          } else {
            dispatch(mediaLoadFailed());
          }
        });

    if (delay > 0) {
      return new Promise(resolve => {
        setTimeout(() => resolve(loadFunction()), delay);
      });
    } else {
      return loadFunction();
    }
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
}): ImplementationMediaFile {
  const mediaFile = {
    id,
    name: basename(assetProxy.path),
    displayURL: assetProxy.url,
    draft,
    file,
    size: file.size,
    url: assetProxy.url,
    path: assetProxy.path,
    field: assetProxy.field,
  };
  return mediaFile;
}

export function persistMedia(file: File, opts: MediaOptions = {}) {
  const { privateUpload, field } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    const files: MediaFile[] = selectMediaFiles(state, field);
    const fileName = sanitizeSlug(file.name.toLowerCase(), state.config.get('slug'));
    const existingFile = files.find(existingFile => existingFile.name.toLowerCase() === fileName);

    const editingDraft = selectEditingDraft(state.entryDraft);

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

    if (integration || !editingDraft) {
      dispatch(mediaPersisting());
    }

    try {
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
            path: fileName,
          });
        }
      } else if (privateUpload) {
        throw new Error('The Private Upload option is only available for Asset Store Integration');
      } else {
        const entry = state.entryDraft.get('entry');
        const collection = state.collections.get(entry?.get('collection'));
        const path = selectMediaFilePath(state.config, collection, entry, fileName, field);
        assetProxy = createAssetProxy({
          file,
          path,
          field,
        });
      }

      dispatch(addAsset(assetProxy));

      let mediaFile: ImplementationMediaFile;
      if (integration) {
        const id = await getBlobSHA(file);
        // integration assets are persisted immediately, thus draft is false
        mediaFile = createMediaFileFromAsset({ id, file, assetProxy, draft: false });
      } else if (editingDraft) {
        const id = await getBlobSHA(file);
        mediaFile = createMediaFileFromAsset({
          id,
          file,
          assetProxy,
          draft: editingDraft,
        });
        return dispatch(addDraftEntryMediaFile(mediaFile));
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

    try {
      if (file.draft) {
        dispatch(removeAsset(file.path));
        dispatch(removeDraftEntryMediaFile({ id: file.id }));
      } else {
        const editingDraft = selectEditingDraft(state.entryDraft);

        dispatch(mediaDeleting());
        dispatch(removeAsset(file.path));

        await backend.deleteMedia(state.config, file.path);

        dispatch(mediaDeleted(file));
        if (editingDraft) {
          dispatch(removeDraftEntryMediaFile({ id: file.id }));
        }
      }
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

export async function getMediaFile(state: State, path: string) {
  const backend = currentBackend(state.config);
  const { url } = await backend.getMediaFile(path);
  return { url };
}

export function loadMediaDisplayURL(file: MediaFile) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const { displayURL, id } = file;
    const state = getState();
    const displayURLState: DisplayURLState = selectMediaDisplayURL(state, id);
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
  field?: EntryField;
}

export function mediaLoaded(files: ImplementationMediaFile[], opts: MediaOptions = {}) {
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

export function mediaPersisted(file: ImplementationMediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_PERSIST_SUCCESS,
    payload: { file, privateUpload },
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

export async function waitForMediaLibraryToLoad(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  state: State,
) {
  if (state.mediaLibrary.get('isLoading') !== false && !state.mediaLibrary.get('externalLibrary')) {
    await waitUntilWithTimeout(dispatch, resolve => ({
      predicate: ({ type }) => type === MEDIA_LOAD_SUCCESS || type === MEDIA_LOAD_FAILURE,
      run: () => resolve(),
    }));
  }
}

export async function getMediaDisplayURL(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  state: State,
  file: MediaFile,
) {
  const displayURLState: DisplayURLState = selectMediaDisplayURL(state, file.id);

  let url: string | null | undefined;
  if (displayURLState.get('url')) {
    // url was already loaded
    url = displayURLState.get('url');
  } else if (displayURLState.get('err')) {
    // url loading had an error
    url = null;
  } else {
    const key = file.id;
    const promise = waitUntilWithTimeout<string>(dispatch, resolve => ({
      predicate: ({ type, payload }) =>
        (type === MEDIA_DISPLAY_URL_SUCCESS || type === MEDIA_DISPLAY_URL_FAILURE) &&
        payload.key === key,
      run: (_dispatch, _getState, action) => resolve(action.payload.url),
    }));

    if (!displayURLState.get('isFetching')) {
      // load display url
      dispatch(loadMediaDisplayURL(file));
    }

    url = await promise;
  }

  return url;
}
