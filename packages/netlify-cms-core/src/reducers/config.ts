import { Map } from 'immutable';
import { CONFIG_REQUEST, CONFIG_SUCCESS, CONFIG_FAILURE } from '../actions/config';
import { Config, ConfigAction } from '../types/redux';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';

const defaultState: Map<string, boolean | string> = Map({ isFetching: true });

function config(state = defaultState, action: ConfigAction) {
  switch (action.type) {
    case CONFIG_REQUEST:
      return state.set('isFetching', true);
    case CONFIG_SUCCESS:
      /**
       * The loadConfig action merges any existing config into the loaded config
       * before firing this action (so the resulting config can be validated),
       * so we don't have to merge it here.
       */
      return action.payload;
    case CONFIG_FAILURE:
      return state.withMutations(s => {
        s.delete('isFetching');
        s.set('error', action.payload.toString());
      });
    default:
      return state;
  }
}

export function selectLocale(state: Config) {
  return state.get('locale', 'en') as string;
}

export function selectUseWorkflow(state: Config) {
  return state.get('publish_mode') === EDITORIAL_WORKFLOW;
}

export default config;
