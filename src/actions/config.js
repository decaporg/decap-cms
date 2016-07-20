import yaml from 'js-yaml';
import { currentBackend } from '../backends/backend';
import { authenticate } from '../actions/auth';
import * as MediaProxy from '../valueObjects/MediaProxy';

export const CONFIG_REQUEST = 'CONFIG_REQUEST';
export const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
export const CONFIG_FAILURE = 'CONFIG_FAILURE';

export function configLoaded(config) {
  return {
    type: CONFIG_SUCCESS,
    payload: config
  };
}

export function configLoading() {
  return {
    type: CONFIG_REQUEST
  };
}

export function configFailed(err) {
  return {
    type: CONFIG_FAILURE,
    error: 'Error loading config',
    payload: err
  };
}

export function configDidLoad(config) {
  return (dispatch) => {
    MediaProxy.setConfig(config);
    dispatch(configLoaded(config));
  };
}


export function loadConfig(config) {
  if (window.CMS_CONFIG) {
    return configDidLoad(window.CMS_CONFIG);
  }
  return (dispatch, getState) => {
    dispatch(configLoading());

    fetch('config.yml').then((response) => {
      if (response.status !== 200) {
        throw `Failed to load config.yml (${response.status})`;
      }

      response.text().then(parseConfig).then((config) => {
        dispatch(configDidLoad(config));
        const backend = currentBackend(config);
        const user = backend && backend.currentUser();
        user && dispatch(authenticate(user));
      });
    }).catch((err) => {
      dispatch(configFailed(err));
    });
  };
}

function parseConfig(data) {
  const config = yaml.safeLoad(data);

  if (typeof CMS_ENV === 'string' && config[CMS_ENV]) {
    for (var key in config[CMS_ENV]) {
      if (config[CMS_ENV].hasOwnProperty(key)) {
        config[key] = config[CMS_ENV][key];
      }
    }
  }
  return config;
}
