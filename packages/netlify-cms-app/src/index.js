import { NetlifyCmsCore as CMS } from 'netlify-cms-core';
import './backends';
import './widgets';
import './editor-components';

if (typeof window !== 'undefined') {
  /**
   * Log the version number.
   */
  if (typeof NETLIFY_CMS_APP_VERSION === 'string') {
    console.log(`netlify-cms-app ${NETLIFY_CMS_APP_VERSION}`);
  }
}

export const NetlifyCmsApp = {
  ...CMS,
};
export default CMS;
