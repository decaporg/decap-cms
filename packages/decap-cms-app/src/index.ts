import { DecapCmsCore as CMS } from 'decap-cms-core';
import './extensions.js';

export * from 'decap-cms-core';

declare global {
  // This is not really a global but a literal injected by babel
  const DECAP_CMS_APP_VERSION: string;
}

// Log version
if (typeof window !== 'undefined') {
  if (typeof DECAP_CMS_APP_VERSION === 'string') {
    console.log(`decap-cms-app ${DECAP_CMS_APP_VERSION}`);
  }
}

export const DecapCmsApp = {
  ...CMS,
};
export default CMS;
