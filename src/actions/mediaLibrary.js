import { actions as notifActions } from 'redux-notifications';
import { currentBackend } from '../backends/backend';

const { notifSend } = notifActions;

export const OPEN_MEDIA_LIBRARY = 'OPEN_MEDIA_LIBRARY';
export const CLOSE_MEDIA_LIBRARY = 'CLOSE_MEDIA_LIBRARY';
export const MEDIA_REQUEST = 'MEDIA_REQUEST';
export const MEDIA_LOAD_SUCCESS = 'MEDIA_LOAD_SUCCESS';
export const MEDIA_LOAD_ERROR = 'MEDIA_LOAD_ERROR';

export function openMediaLibrary() {
  return { type: OPEN_MEDIA_LIBRARY };
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
        dispatch(notifSend({
          message: `Failed to load media: ${ error.message }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
        dispatch(mediaLoadError(error));
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
