import { produce } from 'immer';

import { CONFIG_REQUEST, CONFIG_SUCCESS, CONFIG_FAILURE } from '../actions/config';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';

import type { ConfigAction } from '../actions/config';
import type { CmsConfig } from '../types/redux';

const defaultState = {
  isFetching: true,
};

const config = produce((state: CmsConfig, action: ConfigAction) => {
  switch (action.type) {
    case CONFIG_REQUEST:
      state.isFetching = true;
      break;
    case CONFIG_SUCCESS:
      return {
        ...action.payload,
        isFetching: false,
        error: undefined,
      };
    case CONFIG_FAILURE:
      state.isFetching = false;
      state.error = action.payload.toString();
  }
}, defaultState);

export function selectLocale(state: CmsConfig) {
  return state.locale || 'en';
}

export function selectUseWorkflow(state: CmsConfig) {
  return state.publish_mode === EDITORIAL_WORKFLOW;
}

export default config;
