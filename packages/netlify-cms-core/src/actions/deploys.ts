import { actions as notifActions } from 'redux-notifications';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { currentBackend } from '../backend';
import { selectDeployPreview } from '../reducers';
import { Collection, Entry, State } from '../types/redux';

const { notifSend } = notifActions;

export const DEPLOY_PREVIEW_REQUEST = 'DEPLOY_PREVIEW_REQUEST';
export const DEPLOY_PREVIEW_SUCCESS = 'DEPLOY_PREVIEW_SUCCESS';
export const DEPLOY_PREVIEW_FAILURE = 'DEPLOY_PREVIEW_FAILURE';

function deployPreviewLoading(collection: string, slug: string) {
  return {
    type: DEPLOY_PREVIEW_REQUEST,
    payload: {
      collection,
      slug,
    },
  } as const;
}

function deployPreviewLoaded(
  collection: string,
  slug: string,
  deploy: { url: string | undefined; status: string },
) {
  const { url, status } = deploy;
  return {
    type: DEPLOY_PREVIEW_SUCCESS,
    payload: {
      collection,
      slug,
      url,
      status,
    },
  } as const;
}

function deployPreviewError(collection: string, slug: string) {
  return {
    type: DEPLOY_PREVIEW_FAILURE,
    payload: {
      collection,
      slug,
    },
  } as const;
}

/**
 * Requests a deploy preview object from the registered backend.
 */
export function loadDeployPreview(
  collection: Collection,
  slug: string,
  entry: Entry,
  published: boolean,
  opts?: { maxAttempts?: number; interval?: number },
) {
  return async (dispatch: ThunkDispatch<State, undefined, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const collectionName = collection.get('name');

    // Exit if currently fetching
    const deployState = selectDeployPreview(state, collectionName, slug);
    if (deployState && deployState.isFetching) {
      return;
    }

    dispatch(deployPreviewLoading(collectionName, slug));

    try {
      /**
       * `getDeploy` is for published entries, while `getDeployPreview` is for
       * unpublished entries.
       */
      const deploy = published
        ? backend.getDeploy(collection, slug, entry)
        : await backend.getDeployPreview(collection, slug, entry, opts);
      if (deploy) {
        return dispatch(deployPreviewLoaded(collectionName, slug, deploy));
      }
      return dispatch(deployPreviewError(collectionName, slug));
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
      dispatch(deployPreviewError(collectionName, slug));
    }
  };
}

export type DeploysAction = ReturnType<
  typeof deployPreviewLoading | typeof deployPreviewLoaded | typeof deployPreviewError
>;
