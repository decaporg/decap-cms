import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import history from 'Routing/history';
import store from 'Redux';
import { mergeConfig } from 'Actions/config';
import { getPhrases } from 'Constants/defaultPhrases';
import { I18n } from 'react-polyglot';
import { ErrorBoundary } from 'UI';
import App from 'App/App';
import 'EditorWidgets';
import 'src/mediaLibrary';
import 'what-input';

const ROOT_ID = 'nc-root';

function bootstrap(opts = {}) {
  const { config } = opts;

  /**
   * Log the version number.
   */
  if (NETLIFY_CMS_VERSION) {
    console.log(`netlify-cms ${NETLIFY_CMS_VERSION}`);
  } else if (NETLIFY_CMS_CORE_VERSION) {
    console.log(`netlify-cms-core ${NETLIFY_CMS_CORE_VERSION}`);
  }

  /**
   * Get DOM element where app will mount.
   */
  function getRoot() {
    /**
     * Return existing root if found.
     */
    const existingRoot = document.getElementById(ROOT_ID);
    if (existingRoot) {
      return existingRoot;
    }

    /**
     * If no existing root, create and return a new root.
     */
    const newRoot = document.createElement('div');
    newRoot.id = ROOT_ID;
    document.body.appendChild(newRoot);
    return newRoot;
  }

  /**
   * Dispatch config to store if received. This config will be merged into
   * config.yml if it exists, and any portion that produces a conflict will be
   * overwritten.
   */
  if (config) {
    store.dispatch(mergeConfig(config));
  }

  /**
   * Create connected root component.
   */
  const Root = () => (
    <I18n locale={'en'} messages={getPhrases()}>
      <ErrorBoundary>
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <Route component={App} />
          </ConnectedRouter>
        </Provider>
      </ErrorBoundary>
    </I18n>
  );

  /**
   * Render application root.
   */
  render(<Root />, getRoot());
}

export default bootstrap;
