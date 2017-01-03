import { getIntegrationProvider } from '../integrations';
import { selectIntegration } from '../reducers';


export const UPLOADING_MEDIA = 'UPLOADING_MEDIA';
export const MEDIA_UPLOAD_ERROR = 'MEDIA_UPLOAD_ERROR';
export const ADDED_MEDIA = 'ADDED_MEDIA';
export const REMOVE_MEDIA = 'REMOVE_MEDIA';

export function addedMedia(collection, mediaProxy) {
  return { type: ADDED_MEDIA, payload: { collection, mediaProxy } };
}

export function uploadingMedia(collection, mediaProxy) {
  return { type: UPLOADING_MEDIA, payload: { collection, mediaProxy } };
}

export function uploadingMediaError(collection, mediaProxy, error) {
  return { type: MEDIA_UPLOAD_ERROR, payload: { collection, mediaProxy, error } };
}

export function addMedia(collection, mediaProxy) {
  return (dispatch, getState) => {
    const state = getState();
    const integration = selectIntegration(state, collection, 'assetUpload');

    if (integration) {
      const provider = integration && getIntegrationProvider(state.integrations, integration);
      dispatch(uploadingMedia(collection, mediaProxy));
      provider.upload(mediaProxy).then(
        (response) => {
          dispatch(addedMedia(collection, mediaProxy));
        },
        error => dispatch(uploadingMediaError(collection, mediaProxy, error))
      );  
    } else {
      dispatch(addedMedia(collection, mediaProxy));
    }
  };
}

export function removeMedia(path) {
  return { type: REMOVE_MEDIA, payload: path };
}
