import { NetlifyCmsCore as CMS } from 'netlify-cms-core';
import './backends';
import './widgets';
import './editor-components';

/**
 * Load Netlify CMS automatically if `window.CMS_MANUAL_INIT` is set.
 */
if (!window.CMS_MANUAL_INIT) {
  CMS.init();
} else {
  console.log('`window.CMS_MANUAL_INIT` flag set, skipping automatic initialization.');
}

export const NetlifyCmsApp = {
  ...CMS,
};
export default CMS;
