import AJV from 'ajv';
import ajvErrors from 'ajv-errors';
import yaml from "js-yaml";
import { Map, List, fromJS } from "immutable";
import { trimStart, flow, isBoolean, get } from "lodash";
import { authenticateUser } from "Actions/auth";
import { formatByExtension, supportedFormats, frontmatterFormats } from "Formats/formats";
import { selectIdentifier } from "Reducers/collections";
import { IDENTIFIER_FIELDS } from "Constants/fieldInference";
import * as publishModes from "Constants/publishModes";
import configSchema from '../configSchema';

export const CONFIG_REQUEST = "CONFIG_REQUEST";
export const CONFIG_SUCCESS = "CONFIG_SUCCESS";
export const CONFIG_FAILURE = "CONFIG_FAILURE";
export const CONFIG_MERGE = "CONFIG_MERGE";


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
}

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

function validateCollection(collection) {
  const {
    name,
    folder,
    format,
    extension,
  } = collection.toJS();

  if (!format && extension && !formatByExtension(extension)) {
    // Cannot infer format from extension.
    throw new Error(`Please set a format for collection "${name}". Supported formats are ${supportedFormats.join(',')}`);
  }
  if (folder && !selectIdentifier(collection)) {
    // Verify that folder-type collections have an identifier field for slug creation.
    throw new Error(`Collection "${name}" must have a field that is a valid entry identifier. Supported fields are ${IDENTIFIER_FIELDS.join(', ')}.`);
  }
}


export function validateConfig(config) {
  const ajv = new AJV({ allErrors: true, jsonPointers: true });
  ajvErrors(ajv);
  const jsConfig = config.toJS();

  const valid = ajv.validate(configSchema, jsConfig);
  if (!valid) {
    console.error('Config Errors', ajv.errors);
    const errors = ajv.errors.map(({ message, dataPath }) => {
      const key = dataPath ? `'${ trimStart(dataPath, '/') }' ` : ``;
      return `    ${ key }${ message }`;
    });
    const error = new Error(`\n${ errors.join('\n') }`);
    error.name = 'Config Errors';
    throw error;
  }

  /**
   * Validate Collections
   */
  config.get('collections').forEach(validateCollection);

  return config;
}

function mergePreloadedConfig(preloadedConfig, loadedConfig) {
  const map = fromJS(loadedConfig) || Map();
  return preloadedConfig ? preloadedConfig.mergeDeep(map) : map;
}

function parseConfig(data) {
  const config = yaml.safeLoad(data);
  if (typeof CMS_ENV === "string" && config[CMS_ENV]) {
    Object.keys(config[CMS_ENV]).forEach((key) => {
      config[key] = config[CMS_ENV][key];
    });
  }
  return config;
}

async function getConfig(file, isPreloaded) {
  const response = await fetch(file, { credentials: 'same-origin' });
  if (response.status !== 200) {
    if (isPreloaded) return parseConfig('');
    throw new Error(`Failed to load config.yml (${ response.status })`);
  }
  const contentType = response.headers.get('Content-Type') || 'Not-Found';
  const isYaml = contentType.indexOf('yaml') !== -1;
  if (!isYaml) {
    console.log(`Response for ${ file } was not yaml. (Content-Type: ${ contentType })`);
    if (isPreloaded) return parseConfig('');
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
    error: "Error loading config",
    payload: err,
  };
}

export function configDidLoad(config) {
  return (dispatch) => {
    dispatch(configLoaded(config));
  };
}

export function mergeConfig(config) {
  return { type: CONFIG_MERGE, payload: config };
}

export function loadConfig() {
  if (window.CMS_CONFIG) {
    return configDidLoad(fromJS(window.CMS_CONFIG));
  }
  return async (dispatch, getState) => {
    dispatch(configLoading());

    try {
      const preloadedConfig = getState().config;
      const configUrl = getConfigUrl();
      const loadedConfig = await getConfig(configUrl, preloadedConfig && preloadedConfig.size > 1);

      /**
       * Merge any existing configuration so the result can be validated.
       */
      const mergedConfig = mergePreloadedConfig(preloadedConfig, loadedConfig);
      const config = flow(validateConfig, applyDefaults)(mergedConfig);

      dispatch(configDidLoad(config));
      dispatch(authenticateUser());
    }
    catch(err) {
      dispatch(configFailed(err));
      throw(err)
    }
  };
}
