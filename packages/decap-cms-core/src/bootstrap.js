import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, connect } from 'react-redux';
import { Route, Router } from 'react-router-dom';
import { GlobalStyles } from 'decap-cms-ui-default';
import { I18n } from 'react-polyglot';

import { store } from './redux';
import { history } from './routing/history';
import { loadConfig } from './actions/config';
import { authenticateUser } from './actions/auth';
import { getPhrases } from './lib/phrases';
import { selectLocale } from './reducers/config';
import { ErrorBoundary } from './components/UI';
import App from './components/App/App';
import './components/EditorWidgets';
import './mediaLibrary';
import 'what-input';

const ROOT_ID = 'nc-root';

function TranslatedApp({ locale, config }) {
  return (
    <I18n locale={locale} messages={getPhrases(locale)}>
      <ErrorBoundary showBackup config={config}>
        <Router history={history}>
          <Route component={App} />
        </Router>
      </ErrorBoundary>
    </I18n>
  );
}

function mapDispatchToProps(state) {
  return { locale: selectLocale(state.config), config: state.config };
}

const ConnectedTranslatedApp = connect(mapDispatchToProps)(TranslatedApp);

function bootstrap(opts = {}) {
  const { config } = opts;

  /**
   * Log the version number.
   */
  if (typeof DECAP_CMS_CORE_VERSION === 'string') {
    console.log(`decap-cms-core ${DECAP_CMS_CORE_VERSION}`);
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
  store.dispatch(
    loadConfig(config, function onLoad() {
      store.dispatch(authenticateUser());
    }),
  );

  /**
   * Create connected root component.
   */
  function Root() {
    return (
      <>
        <GlobalStyles />
        <Provider store={store}>
          <ConnectedTranslatedApp />
        </Provider>
      </>
    );
  }

  /**
   * Render application root.
   */
  const root = createRoot(getRoot());
  root.render(<Root />);
}

export default bootstrap;
