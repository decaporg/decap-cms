import { produce } from 'immer';

import { CONFIG_SUCCESS } from '../actions/config';

import type { CmsConfig, Branding } from '../types/redux';
import type { ConfigAction } from '../actions/config';

const defaultState = {
  app_name: 'Decap CMS',
  // logo_url: 'https://avatars.githubusercontent.com/u/37912219',
  // theme: '',
};

const branding = produce((state: Branding, action: ConfigAction) => {
  switch (action.type) {
    case CONFIG_SUCCESS:
      return action.payload.branding;
  }
}, defaultState);

export function selectAppName(state: CmsConfig) {
  return state.branding.app_name;
}

export function selectLogoUrl(state: CmsConfig) {
  return state.branding.logo_url;
}

export function selectTheme(state: CmsConfig) {
  return state.branding.theme;
}

export default branding;
