import yaml from 'js-yaml';
import { values } from 'lodash';
import * as publishModes from '../constants/publishModes';

export default function parseConfig(yml, env = CMS_ENV) {
  let config = yaml.safeLoad(yml);

  if (!config) throw new Error('Config can not be empty.');

  // Merge env to the config and delete env
  if (env in config) {
    config = {
      ...config,
      ...config[env],
    };
    delete config[env];
  }

  if (!('media_folder' in config)) throw new Error('`media_folder` must be set in config.');

  if (!('publish_mode' in config) || values(publishModes).indexOf(config.publish_mode) === -1) {
    // Make sure there is a publish workflow mode set
    config.publish_mode = publishModes.SIMPLE;
  }

  if (!('public_folder' in config)) {
    // Make sure there is a public folder
    config.public_folder = config.media_folder;
  }

  if (config.public_folder && config.public_folder.charAt(0) !== '/') {
    config.public_folder = `/${ config.public_folder }`;
  }

  return config;
}
