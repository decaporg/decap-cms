declare module 'decap-cms-app' {
  import type { CMS } from 'decap-cms-core';

  // Everything else this package exposes comes from decap-cms-core, whose
  // declarations are generated from source (see its tsconfig.build.json).
  export * from 'decap-cms-core';

  export const DecapCmsApp: CMS;

  export default DecapCmsApp;
}
