import bootstrap from './bootstrap';
import Registry from './lib/registry';

export * from './widgets';
export * from './media-libraries';
export * from './editor-components';
export * from './locales';

export const NetlifyCmsCore = {
  ...Registry,
  init: bootstrap,
};
export default NetlifyCmsCore;
