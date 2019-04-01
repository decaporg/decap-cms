import { actions as notifActions } from 'redux-notifications';
import { currentBackend } from 'coreSrc/backend';
import { selectDeployPreview } from 'Reducers';

const { notifSend } = notifActions;

export const DEPLOY_PREVIEW_REQUEST = 'DEPLOY_PREVIEW_REQUEST';
export const DEPLOY_PREVIEW_SUCCESS = 'DEPLOY_PREVIEW_SUCCESS';
export const DEPLOY_PREVIEW_FAILURE = 'DEPLOY_PREVIEW_FAILURE';

export function deployPreviewLoading(collection, slug) {
  return {
    type: DEPLOY_PREVIEW_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

export function deployPreviewLoaded(collection, slug, { url, status }) {
  return {
    type: DEPLOY_PREVIEW_SUCCESS,
    payload: {
      collection: collection.get('name'),
      slug,
      url,
      status,
    },
  };
}

export function deployPreviewError(collection, slug) {
  return {
    type: DEPLOY_PREVIEW_FAILURE,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

/**
 * Requests a deploy preview object from the registered backend.
 */
export function loadDeployPreview(collection, slug, entry, published, opts) {
  return async (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);

    // Exit if currently fetching
    const deployState = selectDeployPreview(state, collection, slug);
    if (deployState && deployState.get('isFetching')) {
      return;
    }

    dispatch(deployPreviewLoading(collection, slug));

    try {
      /**
       * `getDeploy` is for published entries, while `getDeployPreview` is for
       * unpublished entries.
       */
      const deploy = published
        ? backend.getDeploy(collection, slug, entry)
        : await backend.getDeployPreview(collection, slug, entry, opts);
      if (deploy) {
        return dispatch(deployPreviewLoaded(collection, slug, deploy));
      }
      return dispatch(deployPreviewError(collection, slug));
    } catch (error) {
      console.error(error);
      dispatch(
        notifSend({
          message: {
            details: error.message,
            key: 'ui.toast.onFailToLoadDeployPreview',
          },
          kind: 'danger',
          dismissAfter: 8000,
        }),
      );
      dispatch(deployPreviewError(collection, slug));
    }
  };
}
