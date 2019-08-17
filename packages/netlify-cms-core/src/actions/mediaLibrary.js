import { Map } from 'immutable';
import { actions as notifActions } from 'redux-notifications';
import { getBlobSHA } from 'netlify-cms-lib-util';
import { currentBackend } from 'coreSrc/backend';
import { createAssetProxy } from 'ValueObjects/AssetProxy';
import { selectIntegration } from 'Reducers';
import { getIntegrationProvider } from 'Integrations';
import { addAsset } from './media';
import { sanitizeSlug } from 'Lib/urlHelper';

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

export function createMediaLibrary(instance) {
  const api = {
    show: instance.show || (() => {}),
    hide: instance.hide || (() => {}),
    onClearControl: instance.onClearControl || (() => {}),
    onRemoveControl: instance.onRemoveControl || (() => {}),
    enableStandalone: instance.enableStandalone || (() => {}),
  };
  return { type: MEDIA_LIBRARY_CREATE, payload: api };
}

export function clearMediaControl(id) {
  return (dispatch, getState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.onClearControl({ id });
    }
  };
}

export function removeMediaControl(id) {
  return (dispatch, getState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.onRemoveControl({ id });
    }
  };
}

export function openMediaLibrary(payload = {}) {
  return (dispatch, getState) => {
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
  return (dispatch, getState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.get('externalLibrary');
    if (mediaLibrary) {
      mediaLibrary.hide();
    }
    dispatch({ type: MEDIA_LIBRARY_CLOSE });
  };
}

export function insertMedia(mediaPath) {
  return { type: MEDIA_INSERT, payload: { mediaPath } };
}

export function removeInsertedMedia(controlID) {
  return { type: MEDIA_REMOVE_INSERTED, payload: { controlID } };
}

export function loadMedia(opts = {}) {
  const { delay = 0, query = '', page = 1, privateUpload } = opts;
  return async (dispatch, getState) => {
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
      setTimeout(() =>
        resolve(
          backend
            .getMedia()
            .then(files => dispatch(mediaLoaded(files)))
            .catch(
              error =>
                console.error(error) ||
                dispatch(error.status === 404 ? mediaLoaded() : mediaLoadFailed()),
            ),
        ),
      );
    }, delay);
  };
}

export function persistMedia(file, opts = {}) {
  const { privateUpload } = opts;
  return async (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    const files = state.mediaLibrary.get('files');
    const fileName = sanitizeSlug(file.name.toLowerCase(), state.config.get('slug'));
    const existingFile = files.find(existingFile => existingFile.name.toLowerCase() === fileName);

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
      const assetProxy = await createAssetProxy(fileName, file, false, privateUpload);
      dispatch(addAsset(assetProxy));
      if (!integration) {
        const asset = await backend.persistMedia(state.config, assetProxy);
        const displayURL = asset.displayURL || URL.createObjectURL(file);
        return dispatch(mediaPersisted({ id, displayURL, ...asset }));
      }
      return dispatch(
        mediaPersisted(
          { id, displayURL: URL.createObjectURL(file), ...assetProxy.asset },
          { privateUpload },
        ),
      );
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

export function deleteMedia(file, opts = {}) {
  const { privateUpload } = opts;
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    if (integration) {
      const provider = getIntegrationProvider(state.integrations, backend.getToken, integration);
      dispatch(mediaDeleting());
      return provider
        .delete(file.id)
        .then(() => {
          return dispatch(mediaDeleted(file, { privateUpload }));
        })
        .catch(error => {
          console.error(error);
          dispatch(
            notifSend({
              message: `Failed to delete media: ${error.message}`,
              kind: 'danger',
              dismissAfter: 8000,
            }),
          );
          return dispatch(mediaDeleteFailed({ privateUpload }));
        });
    }
    dispatch(mediaDeleting());
    return backend
      .deleteMedia(state.config, file.path)
      .then(() => {
        return dispatch(mediaDeleted(file));
      })
      .catch(error => {
        console.error(error);
        dispatch(
          notifSend({
            message: `Failed to delete media: ${error.message}`,
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        return dispatch(mediaDeleteFailed());
      });
  };
}

export function loadMediaDisplayURL(file) {
  return async (dispatch, getState) => {
    const { displayURL, id, url } = file;
    const state = getState();
    const displayURLState = state.mediaLibrary.getIn(['displayURLs', id], Map());
    if (
      !id ||
      // displayURL is used by most backends; url (like urlIsPublicPath) is used exclusively by the
      // assetStore integration. Only the assetStore uses URLs which can actually be inserted into
      // an entry - other backends create a domain-relative URL using the public_folder from the
      // config and the file's name.
      (!displayURL && !url) ||
      displayURLState.get('url') ||
      displayURLState.get('isFetching') ||
      displayURLState.get('err')
    ) {
      return Promise.resolve();
    }
    if (typeof url === 'string' || typeof displayURL === 'string') {
      dispatch(mediaDisplayURLRequest(id));
      dispatch(mediaDisplayURLSuccess(id, displayURL));
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

export function mediaLoading(page) {
  return {
    type: MEDIA_LOAD_REQUEST,
    payload: { page },
  };
}

export function mediaLoaded(files, opts = {}) {
  return {
    type: MEDIA_LOAD_SUCCESS,
    payload: { files, ...opts },
  };
}

export function mediaLoadFailed(error, opts = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_LOAD_FAILURE, payload: { privateUpload } };
}

export function mediaPersisting() {
  return { type: MEDIA_PERSIST_REQUEST };
}

export function mediaPersisted(asset, opts = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_PERSIST_SUCCESS,
    payload: { file: asset, privateUpload },
  };
}

export function mediaPersistFailed(error, opts = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_PERSIST_FAILURE, payload: { privateUpload } };
}

export function mediaDeleting() {
  return { type: MEDIA_DELETE_REQUEST };
}

export function mediaDeleted(file, opts = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_DELETE_SUCCESS,
    payload: { file, privateUpload },
  };
}

export function mediaDeleteFailed(error, opts = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_DELETE_FAILURE, payload: { privateUpload } };
}

export function mediaDisplayURLRequest(key) {
  return { type: MEDIA_DISPLAY_URL_REQUEST, payload: { key } };
}

export function mediaDisplayURLSuccess(key, url) {
  return {
    type: MEDIA_DISPLAY_URL_SUCCESS,
    payload: { key, url },
  };
}

export function mediaDisplayURLFailure(key, err) {
  console.error(err);
  return {
    type: MEDIA_DISPLAY_URL_FAILURE,
    payload: { key, err },
  };
}
