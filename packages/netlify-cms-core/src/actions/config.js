import yaml from 'js-yaml';
import { Map } from 'immutable';
import { trimStart, get } from 'lodash';
import { authenticateUser } from 'Actions/auth';
import * as publishModes from 'Constants/publishModes';
import { validateConfig } from 'Constants/configSchema';

export const CONFIG_REQUEST = 'CONFIG_REQUEST';
export const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
export const CONFIG_FAILURE = 'CONFIG_FAILURE';
export const CONFIG_MERGE = 'CONFIG_MERGE';

const getConfigUrl = () => {
  const validTypes = { 'text/yaml': 'yaml', 'application/x-yaml': 'yaml' };
  const configLinkEl = document.querySelector('link[rel="cms-config-url"]');
  const isValidLink = configLinkEl && validTypes[configLinkEl.type] && get(configLinkEl, 'href');
  if (isValidLink) {
    const link = get(configLinkEl, 'href');
    console.log(`Using config file path: "${link}"`);
    return link;
  }
  return 'config.yml';
};

const defaults = {
  publish_mode: publishModes.SIMPLE,
};

export function applyDefaults(config) {
  return Map(defaults)
    .mergeDeep(config)
    .withMutations(map => {
      /**
       * Use media_folder as default public_folder.
       */
      const defaultPublicFolder = `/${trimStart(map.get('media_folder'), '/')}`;
      if (!map.get('public_folder')) {
        map.set('public_folder', defaultPublicFolder);
      }
    });
}

function mergePreloadedConfig(...loadedConfig) {
  return Map().mergeDeep(...loadedConfig);
}

function parseConfig(data) {
  const config = yaml.safeLoad(data);
  if (typeof CMS_ENV === 'string' && config[CMS_ENV]) {
    Object.keys(config[CMS_ENV]).forEach(key => {
      config[key] = config[CMS_ENV][key];
    });
  }
  return config;
}

async function getConfig(file) {
  const response = await fetch(file, { credentials: 'same-origin' }).catch(err => err);
  if (response instanceof Error || response.status !== 200) {
    throw new Error(`Failed to load config.yml (${response.status || response})`);
  }
  const contentType = response.headers.get('Content-Type') || 'Not-Found';
  const isYaml = contentType.indexOf('yaml') !== -1;
  if (!isYaml) {
    console.log(`Response for ${file} was not yaml. (Content-Type: ${contentType})`);
  }
  return parseConfig(await response.text());
}

export function configLoaded(config) {
  return {
    type: CONFIG_SUCCESS,
    payload: config,
  };
}

export function configLoading() {
  return {
    type: CONFIG_REQUEST,
  };
}

export function configFailed(err) {
  return {
    type: CONFIG_FAILURE,
    error: 'Error loading config',
    payload: err,
  };
}

export function configDidLoad(config) {
  return dispatch => {
    dispatch(configLoaded(config));
  };
}

export function loadConfig(bootstrapConfig) {
  return async (dispatch) => {
    dispatch(configLoading());

    try {
      const configUrl = getConfigUrl();
      const loadedConfig =
        bootstrapConfig && bootstrapConfig.load_config_file === false
          ? {}
          : await getConfig(configUrl);

      /**
       * Merge any existing configuration so the result can be validated.
       */
      const mergedConfig = mergePreloadedConfig(bootstrapConfig, loadedConfig, window.CMS_CONFIG);
      validateConfig(mergedConfig.toJS());

      const config = applyDefaults(mergedConfig);

      dispatch(configDidLoad(config));
      dispatch(authenticateUser());
    } catch (err) {
      dispatch(configFailed(err));
      throw err;
    }
  };
}
