import React from 'react';
import createReactClass from 'create-react-class';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import history from 'Routing/history';
import configureStore from 'Redux/configureStore';
import { setStore } from 'ValueObjects/AssetProxy';
import { ErrorBoundary } from 'UI'
import registry from 'Lib/registry';
import App from 'App/App';
import 'EditorWidgets';
import 'MarkdownPlugins';
import './index.css';

/**
 * Log the version number.
 */
console.log(`Netlify CMS version ${NETLIFY_CMS_VERSION}`);

/**
 * Create mount element dynamically.
 */
const el = document.createElement('div');
el.id = 'nc-root';
document.body.appendChild(el);

/**
 * Configure Redux store.
 */
const store = configureStore();
setStore(store);

/**
 * Create connected root component.
 */
const Root = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Route component={App}/>
      </ConnectedRouter>
    </Provider>
  </ErrorBoundary>
);

/**
 * Render application root.
 */
render(<Root />, el);

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
