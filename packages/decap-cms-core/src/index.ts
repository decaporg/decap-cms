import bootstrap from './bootstrap';
import Registry from './lib/registry';

import type { CMS } from './types';
export * from './types';

export const DecapCmsCore: CMS = {
  ...Registry,
  init: bootstrap,
};
export default DecapCmsCore;
