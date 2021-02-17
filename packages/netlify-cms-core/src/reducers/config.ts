import { produce } from 'immer';
import { CONFIG_REQUEST, CONFIG_SUCCESS, CONFIG_FAILURE, ConfigAction } from '../actions/config';
import { EDITORIAL_WORKFLOW, SIMPLE } from '../constants/publishModes';
import { CmsConfig } from '../types/redux';

export const defaultState: CmsConfig = {
  backend: {
    name: 'test-repo',
  },
  collections: [],
  publish_mode: SIMPLE,
  locale: 'en',
  slug: {
    encoding: 'unicode',
    clean_accents: false,
    sanitize_replacement: '-',
  },
  error: undefined,
  isFetching: false,
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
