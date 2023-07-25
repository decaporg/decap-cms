import { produce } from 'immer';

import {
  RELEASES_REQUEST,
  RELEASES_SUCCESS,
  RELEASES_FAILURE,
  RELEASE_PUBLICATION_REQUEST,
  RELEASE_PUBLICATION_SUCCESS,
  RELEASE_PUBLICATION_FAILURE,
} from '../actions/releases';

import type { ReleasesAction } from '../types/redux';

type Releases = {
  isFetching: boolean;
  isPublishing: boolean;
  releases: any;
};

const defaultReleases: Releases = {
  isFetching: false,
  isPublishing: false,
  releases: [],
};

const releases = produce((state: Releases, action: ReleasesAction) => {
  switch (action.type) {
    case RELEASES_REQUEST:
      state.isFetching = true;
      break;

    case RELEASES_SUCCESS:
      state.releases = action.payload;
      state.isFetching = false;
      break;

    case RELEASES_FAILURE:
      state.isFetching = false;
      break;

    case RELEASE_PUBLICATION_REQUEST:
      state.isPublishing = true;
      break;

    case RELEASE_PUBLICATION_SUCCESS:
      state.isPublishing = false;
      break;

    case RELEASE_PUBLICATION_FAILURE:
      state.isPublishing = false;
      break;

    default:
      return state;
  }

}, defaultReleases);

export default releases;
