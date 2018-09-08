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

async function init({ options = { config: {} }, handleInsert }) {
  const cloudinaryConfig = { ...defaultConfig, ...options.config, ...enforcedConfig };
  console.log(cloudinaryConfig);

  await loadScript('https://media-library.cloudinary.com/global/all.js');

  const insertHandler = data => {
    const assets = data.assets.map(a => options.useSecureUrl ? a.secure_url : a.url);
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
