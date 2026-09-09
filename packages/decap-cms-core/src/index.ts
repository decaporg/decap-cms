import bootstrap from './bootstrap';
import Registry from './lib/registry';

import type { CMS } from './types';
export * from './types';

// `satisfies` rather than an annotation: the emitted type is derived from the
// implementation, so the published typings cannot silently omit an API the
// registry actually exposes. `CMS` stays as a compatibility check.
export const DecapCmsCore = {
  ...Registry,
  init: bootstrap,
} satisfies CMS;
export default DecapCmsCore;
