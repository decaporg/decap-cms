import bootstrap from './bootstrap';
import registry from 'Lib/registry';

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
  window.createClass =
    window.createClass ||
    ((...args) => {
      console.warn('Deprecation: Use `CMS.createClass` instead of `createClass`.');
      return registry.createClass(...args);
    });
  window.h =
    window.h ||
    ((...args) => {
      console.warn('Deprecation: Use `CMS.h` instead of `h`.');
      return registry.h(...args);
    });
}

export { registry as default, bootstrap as init };
