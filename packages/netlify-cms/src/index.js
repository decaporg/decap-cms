import CMS, { init } from 'netlify-cms-core/src';
import createCustomRelationWidget from 'netlify-cms-custom-relation/src';
import EntryLoader from 'netlify-cms-entry-loader/src';
import * as styles from 'netlify-cms-ui-default/src/styles';
import './backends';
import './widgets';
import './editor-components';
import './media-libraries';

// #if e = process.env.NODE_ENV !== 'production'

/**
 * Load Netlify CMS automatically if `window.CMS_MANUAL_INIT` is set.
 */
if (!window.CMS_MANUAL_INIT) {
  init();
} else {
  console.log('`window.CMS_MANUAL_INIT` flag set, skipping automatic initialization.');
}

/**
 * Add extension hooks to global scope.
 */
if (typeof window !== 'undefined') {
  window.CMS = CMS;
  window.initCMS = init;
  window.CMS.createCustomRelationWidget = createCustomRelationWidget;
  window.CMS.EntryLoader = EntryLoader;
  window.CMS.styles = styles;
}

// #endif

export { CMS as default, init, createCustomRelationWidget, EntryLoader, styles };
