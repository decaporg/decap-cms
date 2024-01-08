import { DecapCmsCore as CMS } from 'decap-cms-core';
import './extensions.js';

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
