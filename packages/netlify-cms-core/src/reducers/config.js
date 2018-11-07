import { Map } from 'immutable';
import { CONFIG_REQUEST, CONFIG_SUCCESS, CONFIG_FAILURE, CONFIG_MERGE } from 'Actions/config';

const config = (state = Map({ isFetching: true }), action) => {
  switch (action.type) {
    case CONFIG_MERGE:
      return state.mergeDeep(action.payload);
    case CONFIG_REQUEST:
      return state.set('isFetching', true);
    case CONFIG_SUCCESS:
      /**
       * The loadConfig action merges any existing config into the loaded config
       * before firing this action (so the resulting config can be validated),
       * so we don't have to merge it here.
       */
      return action.payload.delete('isFetching');
    case CONFIG_FAILURE:
      return Map({ error: action.payload.toString() });
    default:
      return state;
  }
};

export default config;
