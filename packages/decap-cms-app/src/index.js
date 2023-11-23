import { DecapCmsCore as CMS } from 'decap-cms-core';
import dayjs from 'dayjs';
import './extensions.js';

// Log version
if (typeof window !== 'undefined') {
  if (typeof DECAP_CMS_APP_VERSION === 'string') {
    console.log(`decap-cms-app ${DECAP_CMS_APP_VERSION}`);
  }
}

export const DecapCmsApp = {
  ...CMS,
  dayjs,
};
export default CMS;
