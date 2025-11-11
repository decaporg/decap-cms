import createReactClass from 'create-react-class';
import React from 'react';
import { DecapCmsApp as CMS } from 'decap-cms-app';
import './extensions';

/**
 * Load Decap CMS automatically if `window.CMS_MANUAL_INIT` is set.
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
  if (typeof DECAP_CMS_VERSION === 'string') {
    console.log(`decap-cms ${DECAP_CMS_VERSION}`);
  }
}

export const DecapCms = {
  ...CMS,
};
export default CMS;
