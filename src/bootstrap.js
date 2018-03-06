import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import history from 'Routing/history';
import configureStore from 'Redux/configureStore';
import { mergeConfig } from 'Actions/config';
import { setStore } from 'ValueObjects/AssetProxy';
import { ErrorBoundary } from 'UI'
import App from 'App/App';
import 'EditorWidgets';
import 'MarkdownPlugins';
import './index.css';

function bootstrap(opts = {}) {

  const { config } = opts;

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

  /**
   * Dispatch config to store if received. This config will be merged into
   * config.yml if it exists, and any portion that produces a conflict will be
   * overwritten.
   */
  if (config) {
    store.dispatch(mergeConfig(config));
  }

  /**
   * Pass initial state into AssetProxy factory.
   */
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
}

export default bootstrap;
