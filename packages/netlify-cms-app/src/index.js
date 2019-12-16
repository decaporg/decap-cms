import { NetlifyCmsCore as CMS } from 'netlify-cms-core';
import './extensions.js';

// Log version
if (typeof window !== 'undefined') {
  if (typeof NETLIFY_CMS_APP_VERSION === 'string') {
    console.log(`netlify-cms-app ${NETLIFY_CMS_APP_VERSION}`);
  }
}

export const NetlifyCmsApp = {
  ...CMS,
};
export default CMS;
