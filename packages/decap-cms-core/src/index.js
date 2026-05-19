import bootstrap from './bootstrap';
import Registry from './lib/registry';

export const DecapCmsCore = {
  ...Registry,
  init: bootstrap,
};
export default DecapCmsCore;
