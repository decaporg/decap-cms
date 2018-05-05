import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import bootstrap from './bootstrap';
import registry from 'Lib/registry';
import createReactClass from 'create-react-class';
import classNames from 'classnames';

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
  window.CMS.lib = { React, PropTypes, Immutable, ImmutablePropTypes, classNames };
}

export { registry as default, bootstrap as init };
