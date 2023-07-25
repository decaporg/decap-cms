import { actions as notifActions } from 'redux-notifications';
import { currentBackend } from '../backend';
import type {
  State,
  Releases,
} from '../types/redux';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

const { notifSend } = notifActions;

/*
 * Constant Declarations
 */
export const RELEASES_REQUEST = 'RELEASES_REQUEST';
export const RELEASES_SUCCESS = 'RELEASES_SUCCESS';
export const RELEASES_FAILURE = 'RELEASES_FAILURE';
export const RELEASE_PUBLICATION_REQUEST = 'RELEASE_PUBLICATION_REQUEST';
export const RELEASE_PUBLICATION_SUCCESS = 'RELEASE_PUBLICATION_SUCCESS';
export const RELEASE_PUBLICATION_FAILURE = 'RELEASE_PUBLICATION_FAILURE';

/*
 * Simple Action Creators (Internal)
 */

function releasesLoading() {
  return {
    type: RELEASES_REQUEST,
  };
}

function releasesLoaded(releases: Releases) {
  return {
    type: RELEASES_SUCCESS,
    payload: releases,
  };
}

function releasesFailed(error: Error) {
  return {
    type: RELEASES_FAILURE,
    error: 'Failed to load releases',
    payload: error,
  };
}

function releasePublicationLoading() {
  return {
    type: RELEASE_PUBLICATION_REQUEST,
  };
}

function releasePublicationSuccess() {
  console.log(RELEASE_PUBLICATION_SUCCESS);
  return {
    type: RELEASE_PUBLICATION_SUCCESS,
  };
}

function releasePublicationFailed(error: Error) {
  return {
    type: RELEASE_PUBLICATION_FAILURE,
    error: 'Failed to publish release',
    payload: error,
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadReleases() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(releasesLoading());
    backend
      .listReleases()
      .then(response => dispatch(releasesLoaded(response)))
      .catch((error: Error) => {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(releasesFailed(error));
        Promise.reject(error);
      });
  };
}

export function createRelease(version: 'string') {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(releasePublicationLoading());

    try {
      await backend.publishRelease(version)
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.releasePublished',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
      dispatch(releasePublicationSuccess());
    } catch (error: any) {
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.onReleaseFailed',
            details: error,
          },
          kind: 'danger',
          dismissAfter: 8000,
        }),
      );
      return Promise.reject(
        dispatch(releasePublicationFailed(error)),
      );
    } finally {
      setTimeout(() => {
        dispatch(loadReleases())
      }, 2000);
    }
  };
}
