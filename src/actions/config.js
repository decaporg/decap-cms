import yaml from "js-yaml";
import { set, defaultsDeep, get } from "lodash";
import { authenticateUser } from "../actions/auth";
import * as publishModes from "../constants/publishModes";

export const CONFIG_REQUEST = "CONFIG_REQUEST";
export const CONFIG_SUCCESS = "CONFIG_SUCCESS";
export const CONFIG_FAILURE = "CONFIG_FAILURE";

const defaults = {
  publish_mode: publishModes.SIMPLE,
};

export function applyDefaults(config) {
  // Make sure there is a public folder
  set(defaults,
    "public_folder",
    config.media_folder.charAt(0) === "/" ? config.media_folder : `/${ config.media_folder }`);

  return defaultsDeep(config, defaults);
}

export function validateConfig(config) {
  if (!get(config, 'backend')) {
    throw new Error("Error in configuration file: A `backend` wasn't found. Check your config.yml file.");
  }
  if (!get(config, ['backend', 'name'])) {
    throw new Error("Error in configuration file: A `backend.name` wasn't found. Check your config.yml file.");
  }
  if (typeof config.backend.name !== 'string') {
    throw new Error("Error in configuration file: Your `backend.name` must be a string. Check your config.yml file.");
  }
  if (!get(config, 'media_folder')) {
    throw new Error("Error in configuration file: A `media_folder` wasn\'t found. Check your config.yml file.");
  }
  if (typeof config.media_folder !== 'string') {
    throw new Error("Error in configuration file: Your `media_folder` must be a string. Check your config.yml file.");
  }
  if (!get(config, 'collections')) {
    throw new Error("Error in configuration file: A `collections` wasn\'t found. Check your config.yml file.");
  }
  if (!Array.isArray(config.collections) || config.collections.length === 0 || !config.collections[0]) {
    throw new Error("Error in configuration file: Your `collections` must be an array with at least one element. Check your config.yml file.");
  }
  return config;
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

export function loadConfig() {
  if (window.CMS_CONFIG) {
    return configDidLoad(window.CMS_CONFIG);
  }
  return (dispatch) => {
    dispatch(configLoading());

    fetch("config.yml", { credentials: 'same-origin' })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Failed to load config.yml (${ response.status })`);
      }
      return response.text();
    })
    .then(parseConfig)
    .then(validateConfig)
    .then(applyDefaults)
    .then((config) => {
      dispatch(configDidLoad(config));
      dispatch(authenticateUser());
    })
    .catch((err) => {
      dispatch(configFailed(err));
    });
  };
}
