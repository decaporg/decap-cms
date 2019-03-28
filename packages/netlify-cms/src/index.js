import createReactClass from 'create-react-class';
import React from 'react';
import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';
import './media-libraries';

/**
 * Load Netlify CMS automatically if `window.CMS_MANUAL_INIT` is set.
 */
if (!window.CMS_MANUAL_INIT) {
  CMS.init();
} else {
  console.log('`window.CMS_MANUAL_INIT` flag set, skipping automatic initialization.');
}

/**
 * Add extension hooks to global scope.
 */
if (typeof window !== 'undefined') {
  window.CMS = CMS;
  window.initCMS = CMS.init;
  window.createClass = window.createClass || createReactClass;
  window.h = window.h || React.createElement;
  /**
   * Log the version number.
   */
  if (typeof NETLIFY_CMS_VERSION === 'string') {
    console.log(`netlify-cms ${NETLIFY_CMS_VERSION}`);
  }
}

export const NetlifyCms = {
  ...CMS,
};
export default CMS;
