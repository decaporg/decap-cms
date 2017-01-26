import yaml from "js-yaml";
import { set, defaultsDeep } from "lodash";
import { authenticateUser } from "../actions/auth";
import * as publishModes from "../constants/publishModes";

export const CONFIG_REQUEST = "CONFIG_REQUEST";
export const CONFIG_SUCCESS = "CONFIG_SUCCESS";
export const CONFIG_FAILURE = "CONFIG_FAILURE";

const defaults = {
  publish_mode: publishModes.SIMPLE,
};

export function applyDefaults(config) {
  if (!("media_folder" in config)) {
    throw new Error("Error in configuration file: A `media_folder` wasn't found. Check your config.yml file.");
  }

  // Make sure there is a public folder
  set(defaults,
    "public_folder",
    config.media_folder.charAt(0) === "/" ? config.media_folder : `/${ config.media_folder }`);

  return defaultsDeep(config, defaults);
}

function parseConfig(data) {
  const config = yaml.safeLoad(data);
  if (typeof CMS_ENV === "string" && config[CMS_ENV]) {
    // TODO: Add tests and refactor
    for (const key in config[CMS_ENV]) { // eslint-disable-line no-restricted-syntax
      if (config[CMS_ENV].hasOwnProperty(key)) { // eslint-disable-line no-prototype-builtins
        config[key] = config[CMS_ENV][key];
      }
    }
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

    fetch("config.yml", { credentials: 'same-origin' }).then((response) => {
      if (response.status !== 200) {
        throw new Error(`Failed to load config.yml (${ response.status })`);
      }

      response
        .text()
        .then(parseConfig)
        .then(applyDefaults)
        .then((config) => {
          dispatch(configDidLoad(config));
          dispatch(authenticateUser());
        });
    }).catch((err) => {
      dispatch(configFailed(err));
    });
  };
}
