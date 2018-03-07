/**
 * This module provides a self-initializing CMS instance with API hooks added to
 * the `window` object.
 */
import React from 'react';
import bootstrap from './bootstrap';
import registry from 'Lib/registry';
import createReactClass from 'create-react-class';

const CMS = (function startApp() {
  /**
   * Load the app, bail if bootstrapping fails. This will most likely occur
   * if both automatic and manual initialization are attempted.
   */
  if (!bootstrap()) {
    return;
  }

  /**
   * Add extension hooks to global scope.
   */
  const api = { ...registry };
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
