import { actions as notifActions } from 'redux-notifications';
import { currentBackend } from '../backends/backend';
import { getAsset } from '../reducers';

const { notifSend } = notifActions;

export const MEDIA_LIBRARY_OPEN = 'MEDIA_LIBRARY_OPEN';
export const MEDIA_LIBRARY_CLOSE = 'MEDIA_LIBRARY_CLOSE';
export const MEDIA_INSERT = 'MEDIA_INSERT';
export const MEDIA_LOAD_REQUEST = 'MEDIA_LOAD_REQUEST';
export const MEDIA_LOAD_SUCCESS = 'MEDIA_LOAD_SUCCESS';
export const MEDIA_LOAD_ERROR = 'MEDIA_LOAD_ERROR';
export const MEDIA_PERSIST_REQUEST = 'MEDIA_PERSIST_REQUEST';
export const MEDIA_PERSIST_SUCCESS = 'MEDIA_PERSIST_SUCCESS';
export const MEDIA_PERSIST_FAILURE = 'MEDIA_PERSIST_FAILURE';
export const MEDIA_DELETE_REQUEST = 'MEDIA_DELETE_REQUEST';
export const MEDIA_DELETE_SUCCESS = 'MEDIA_DELETE_SUCCESS';
export const MEDIA_DELETE_FAILURE = 'MEDIA_DELETE_FAILURE';

export function openMediaLibrary(payload) {
  return { type: MEDIA_LIBRARY_OPEN, payload };
}

export function closeMediaLibrary() {
  return { type: MEDIA_LIBRARY_CLOSE };
}

export function insertMedia(mediaPath) {
  return { type: MEDIA_INSERT, payload: { mediaPath } };
}

export function loadMedia(delay = 0) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(mediaLoading());
    return new Promise(resolve => {
      setTimeout(() => resolve(
        backend.getMedia()
          .then(files => {
            dispatch(mediaLoaded(files));
          })
          .catch((error) => {
            dispatch(mediaLoadFailed());
          })
      ));
    }, delay);
  };
}

export function persistMedia(files) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);

    const assetProxies = files.map(file => getAsset(state, file.path));
    dispatch(mediaPersisting());
    return backend
      .persistMedia(assetProxies)
      .then(() => dispatch(mediaPersisted()))
      .catch((error) => {
        console.error(error);
        dispatch(notifSend({
          message: `Failed to persist media: ${ error }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
        return dispatch(mediaPersistFailed());
      });
  };
}

export function deleteMedia(file) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(mediaDeleting());
    return backend.deleteMedia(file.path)
      .then(() => {
        dispatch(mediaDeleted());
        return dispatch(loadMedia(500));
      })
      .catch(error => {
        console.error(error);
        dispatch(notifSend({
          message: `Failed to delete media: ${ error.message }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
        return dispatch(mediaDeleteFailed());
      });
  };
}

export function mediaLoading() {
  return { type: MEDIA_LOAD_REQUEST };
}

export function mediaLoaded(files) {
  return {
    type: MEDIA_LOAD_SUCCESS,
    payload: { files }
  };
}

export function mediaLoadFailed(error) {
  return { type: MEDIA_LOAD_ERROR };
}

export function mediaPersisting() {
  return { type: MEDIA_PERSIST_REQUEST };
}

export function mediaPersisted() {
  return { type: MEDIA_PERSIST_SUCCESS };
}

export function mediaPersistFailed(error) {
  return { type: MEDIA_PERSIST_FAILURE };
}

export function mediaDeleting() {
  return { type: MEDIA_DELETE_REQUEST };
}

export function mediaDeleted(path) {
  return {
    type: MEDIA_DELETE_SUCCESS,
    payload: { path },
  };
}

export function mediaDeleteFailed(error) {
  return { type: MEDIA_DELETE_FAILURE };
}
