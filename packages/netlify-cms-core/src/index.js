import bootstrap from './bootstrap';
import Registry from './lib/registry';

export * from './widgets';

export const NetlifyCmsCore = {
  ...Registry,
  init: bootstrap,
};
export default NetlifyCmsCore;
