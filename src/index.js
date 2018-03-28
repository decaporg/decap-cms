import React from 'react';
import bootstrap from './bootstrap';
import registry from 'Lib/registry';
import createReactClass from 'create-react-class';

/**
 * Load Netlify CMS automatically if `window.CMS_MANUAL_INIT` is set.
 */
if (!window.CMS_MANUAL_INIT) {
  bootstrap();
} else {
  console.log('`window.CMS_MANUAL_INIT` flag set, skipping automatic initialization.');
}

/**
 * Add extension hooks to global scope.
 */
if (typeof window !== 'undefined') {
  window.CMS = registry;
  window.initCMS = bootstrap;
  window.createClass = window.createClass || createReactClass;
  window.h = window.h || React.createElement;
}

export { registry as default, bootstrap as init };
