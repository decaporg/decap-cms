/**
 * This module provides a self-initializing CMS instance with API hooks added to
 * the `window` object.
 */
import React from 'react';
import bootstrap from './bootstrap';
import registry from 'Lib/registry';
import createReactClass from 'create-react-class';

/**
 * Load the app.
 */
bootstrap();

/**
 * Add extension hooks to global scope.
 */
const CMS = { ...registry };
if (typeof window !== 'undefined') {
  window.CMS = CMS;
  window.createClass = window.createClass || createReactClass;
  window.h = window.h || React.createElement;
}

/**
 * Export the registry for projects that import the CMS.
 */
export default CMS;
