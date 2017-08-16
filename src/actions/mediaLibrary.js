import { actions as notifActions } from 'redux-notifications';
import { currentBackend } from '../backends/backend';
import { getAsset } from '../reducers';

const { notifSend } = notifActions;

export const OPEN_MEDIA_LIBRARY = 'OPEN_MEDIA_LIBRARY';
export const CLOSE_MEDIA_LIBRARY = 'CLOSE_MEDIA_LIBRARY';
export const MEDIA_REQUEST = 'MEDIA_REQUEST';
export const MEDIA_LOAD_SUCCESS = 'MEDIA_LOAD_SUCCESS';
export const MEDIA_LOAD_ERROR = 'MEDIA_LOAD_ERROR';
export const MEDIA_PERSIST_REQUEST = 'MEDIA_PERSIST_REQUEST';
export const MEDIA_PERSIST_SUCCESS = 'MEDIA_PERSIST_SUCCESS';
export const MEDIA_PERSIST_FAILURE = 'MEDIA_PERSIST_FAILURE';
export const MEDIA_DELETE_SUCCESS = 'MEDIA_DELETE_SUCCESS';

export function openMediaLibrary(fieldName) {
  return { type: OPEN_MEDIA_LIBRARY, payload: { fieldName } };
}

export function closeMediaLibrary() {
  return { type: CLOSE_MEDIA_LIBRARY };
}

export function loadMedia() {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(mediaLoading());
    return backend.getMedia()
      .then(files => {
        return dispatch(mediaLoaded(files));
      })
      .catch((error) => {
        return dispatch(mediaLoaded());
      });
  };
}

export function persistMedia(files) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);

    const assetProxies = files.map(file => getAsset(state, file.path));
    //dispatch(mediaPersisting());
    return backend
      .persistMedia(assetProxies)
      .then(() => dispatch(mediaPersisted()))
      .catch((error) => {
        dispatch(notifSend({
          message: `Failed to persist media: ${ error }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
        return dispatch(mediaPersistFailed(error));
      });
  };
}

export function deleteMedia(files) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    let currentOp = backend.deleteMedia(files.shift().path);
    while (files.length > 0) {
      const file = files.shift();
      currentOp = currentOp.then(() => backend.deleteMedia(file.path));
    }
    return currentOp
      .then(() => {
        return dispatch(mediaDeleted());
      })
      .catch(error => {
        return dispatch(notifSend({
          message: `Failed to delete media: ${ error.message }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
      });
  };
}

export function mediaLoading() {
  return { type: MEDIA_REQUEST };
}

export function mediaLoaded(files) {
  return {
    type: MEDIA_LOAD_SUCCESS,
    payload: { files }
  };
}

export function mediaLoadFailed() {
  return { type: MEDIA_LOAD_ERROR };
}

export function mediaPersisting() {
  return { type: MEDIA_PERSIST_REQUEST };
}

export function mediaPersisted() {
  return { type: MEDIA_PERSIST_SUCCESS };
}

export function mediaPersistFailed(error) {
  return {
    type: MEDIA_PERSIST_FAILURE,
    error: 'Failed to persist media',
    payload: {
      error: error.toString(),
    },
  };
}

export function mediaDeleted(path) {
  return {
    type: MEDIA_DELETE_SUCCESS,
    payload: { path },
  };
}
