import { fromJS, OrderedMap } from 'immutable';

import { CONFIG_SUCCESS } from '../actions/config';

import type { ConfigAction } from '../actions/config';

const defaultState: Collections = fromJS({});

function resources(state = defaultState, action: ConfigAction) {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const resources = action.payload.resources;
      let newState = OrderedMap({});
      resources.forEach(resource => {
        newState = newState.set(resource.name, fromJS(resource));
      });
      return newState;
    }
    default:
      return state;
  }
}

export default resources;
