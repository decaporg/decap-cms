import { produce } from 'immer';

import { CONFIG_SUCCESS } from '../actions/config';

import type { ConfigAction } from '../actions/config';
import type { Resources } from '../types/redux';

const defaultState = {};

const resources = produce((state: Resources, action: ConfigAction) => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const resources = action.payload.resources || [];

      resources.map(resource => {
        state[resource.name] = resource;
      });

      return state;
    }
    default:
      return state;
  }
}, defaultState);

export default resources;
