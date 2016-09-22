import Immutable from 'immutable';
import _ from 'lodash';
import * as publishModes from '../constants/publishModes';
import { CONFIG_REQUEST, CONFIG_SUCCESS, CONFIG_FAILURE } from '../actions/config';

const defaults = {
  publish_mode: publishModes.SIMPLE
};

const searchDefaults = {
  use_for_filter: true,
  use_for_listing: true
};

const applyDefaults = (config) => {
  // Make sure there is a public folder
  _.set(defaults,
        'public_folder',
        config.media_folder.charAt(0) === '/' ? config.media_folder : '/' + config.media_folder);


  // If the user configured Search integration, apply default search configs
  if (config.integrations && config.integrations.search) {
    _.set(defaults, 'integrations.search', searchDefaults);
  }

  return _.defaultsDeep(config, defaults);
};

const config = (state = null, action) => {
  switch (action.type) {
    case CONFIG_REQUEST:
      return Immutable.Map({ isFetching: true });
    case CONFIG_SUCCESS:
      const config = applyDefaults(action.payload);
      return Immutable.fromJS(config);
    case CONFIG_FAILURE:
      return Immutable.Map({ error: action.payload.toString() });
    default:
      return state;
  }
};

export default config;
