import bootstrap from './bootstrap';
import Registry from './lib/registry';

export * from './backends';
export * from './widgets';
export * from './media-libraries';
export * from './editor-components';
export * from './locales';
export * from './lib';

export const NetlifyCmsCore = {
  ...Registry,
  init: bootstrap,
};
export default NetlifyCmsCore;
