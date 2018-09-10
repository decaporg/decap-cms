import { loadScript } from 'netlify-cms-lib-util';

/**
 * This configuration hash cannot be overriden, as the values here are required
 * for the integration to work properly.
 */
const enforcedConfig = {
  button_class: undefined,
  inline_container: undefined,
  insert_transformation: false,
  z_index: '99999',
};

const defaultConfig = {
  multiple: false,
};

function getAssetUrl(asset, useSecureUrl) {
  /**
   * Get url from `derived` property if it exists. This property contains the
   * transformed version of image if transformations have been applied.
   */
  const urlObject = asset.derived ? asset.derived[0] : asset;

  /**
   * Retrieve the `https` variant of the image url if the `useSecureUrl` option
   * is set to `true` (this is the default setting).
   */
  const urlKey = useSecureUrl ? 'secure_url' : 'url';

  return urlObject[urlKey];
}


async function init({ options = { config: {} }, handleInsert }) {
  const cloudinaryConfig = { ...defaultConfig, ...options.config, ...enforcedConfig };

  await loadScript('https://media-library.cloudinary.com/global/all.js');

  const insertHandler = data => {
    const assets = data.assets.map(asset => getAssetUrl(asset, options.useSecureUrl));
    handleInsert(cloudinaryConfig.multiple ? assets : assets[0]);
  }

  const mediaLibrary = cloudinary.createMediaLibrary(cloudinaryConfig, { insertHandler });

  return {
    show: () => mediaLibrary.show(),
    hide: () => mediaLibrary.hide(),
    enableStandalone: () => true,
  };
}

const cloudinaryMediaLibrary = { name: 'cloudinary', init };

export default cloudinaryMediaLibrary;
