import { produce } from 'immer';
import deepmerge from 'deepmerge';
import {
  CONFIG_REQUEST,
  CONFIG_SUCCESS,
  CONFIG_FAILURE,
  CONFIG_MERGE,
  ConfigAction,
} from '../actions/config';
import { EDITORIAL_WORKFLOW, SIMPLE } from '../constants/publishModes';
import { CmsConfig } from '../types/redux';

export const defaultState: CmsConfig = {
  backend: {},
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

const config = produce((state = defaultState, action: ConfigAction) => {
  switch (action.type) {
    case CONFIG_MERGE:
      return deepmerge(state, action.payload);
    case CONFIG_REQUEST:
      state.isFetching = true;
      break;
    case CONFIG_SUCCESS:
      /**
       * The loadConfig action merges any existing config into the loaded config
       * before firing this action (so the resulting config can be validated),
       * so we don't have to merge it here.
       */
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

export const selectLocale = (state: CmsConfig) => state.locale || 'en';

export const selectUseWorkflow = (state: CmsConfig) => state.publish_mode === EDITORIAL_WORKFLOW;

export default config;
