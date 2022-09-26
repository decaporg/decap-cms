import bootstrap from './bootstrap';
import Registry from './lib/registry';
import loadDev from './dev';

export * from './backends';
export * from './widgets';
export * from './media-libraries';
export * from './editor-components';
export * from './locales';
export * from './lib';
export * from './ui';

export const CMS = {
  ...Registry,
  init: bootstrap,
};

// TODO Fix - setup permament fix for dev environment
// loadDev(CMS);

export default CMS;
