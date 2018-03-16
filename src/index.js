/**
 * This module provides a self-initializing CMS instance with API hooks added to
 * the `window` object.
 */
import React from 'react';
import bootstrap, { ROOT_ID } from './bootstrap';
import registry from 'Lib/registry';
import createReactClass from 'create-react-class';

let initialized = false;

/**
 * Allow init of the CMS.
 */
function init(opts = {}) {
  if (initialized) {
    console.error('Bootstrap attempted, but Netlify CMS is already initialized!');
    return;
  }
  initialized = bootstrap(opts);
  return initialized;
}

/**
 * Allow reset of the CMS to allow render after unmount
 */
function reset() {
  initialized = false;
}

const CMS = (function startApp() {
  /**
   * Load the app, bail if root element exists or no-auto element.
   * Use <div id="no-auto" /> in your app if you are not persisting the root element.
   *  (in example: as a React Route)
   */
  if (document.getElementById('no-auto') || document.getElementById(ROOT_ID)) {
    console.log('CMS is running in manual mode. [using init() to initialize]');
  } else {
    init();
  }

  /**
   * Add extension hooks to global scope.
   */
  const api = { init, reset, ...registry };
  if (typeof window !== 'undefined') {
    window.CMS = api;
    window.createClass = window.createClass || createReactClass;
    window.h = window.h || React.createElement;
  }
  return api;
})()

/**
 * Export the registry for projects that import the CMS.
 */
export default CMS;

/**
 * Export the init, reset and registry standalone. (optional)
 */
export { init, reset, registry };
