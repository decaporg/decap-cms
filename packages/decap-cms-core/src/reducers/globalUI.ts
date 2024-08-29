import { produce } from 'immer';

import { USE_OPEN_AUTHORING } from '../actions/auth';

import type { AnyAction } from 'redux';

export type GlobalUI = {
  isFetching: boolean;
  useOpenAuthoring: boolean;
};

const LOADING_IGNORE_LIST = [
  'DEPLOY_PREVIEW',
  'STATUS_REQUEST',
  'STATUS_SUCCESS',
  'STATUS_FAILURE',
];

function ignoreWhenLoading(action: AnyAction) {
  return LOADING_IGNORE_LIST.some(type => action.type.includes(type));
}

const defaultState: GlobalUI = {
  isFetching: false,
  useOpenAuthoring: false,
};

/**
 * Reducer for some global UI state that we want to share between components
 */
const globalUI = produce((state: GlobalUI, action: AnyAction) => {
  // Generic, global loading indicator
  if (!ignoreWhenLoading(action) && action.type.includes('REQUEST')) {
    state.isFetching = true;
  } else if (
    !ignoreWhenLoading(action) &&
    (action.type.includes('SUCCESS') || action.type.includes('FAILURE'))
  ) {
    state.isFetching = false;
  } else if (action.type === USE_OPEN_AUTHORING) {
    state.useOpenAuthoring = true;
  }
}, defaultState);

export default globalUI;
