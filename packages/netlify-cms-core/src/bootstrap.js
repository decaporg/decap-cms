import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import history from 'Routing/history';
import store from 'ReduxStore';
import { mergeConfig } from 'Actions/config';
import { getPhrases } from 'Lib/phrases';
import { selectLocale } from 'Reducers/config';
import { I18n } from 'react-polyglot';
import { ThemeProvider } from 'emotion-theming';
import { GlobalStyles } from 'netlify-cms-ui-legacy';
import { ErrorBoundary } from 'UI';
import { lightTheme, darkTheme, isWindowDown } from 'netlify-cms-ui-default';
import App from 'App/App';
import 'EditorWidgets';
import 'coreSrc/mediaLibrary';
import 'what-input';

const ROOT_ID = 'nc-root';

const TranslatedApp = ({ locale }) => {
  return (
    <I18n locale={locale} messages={getPhrases(locale)}>
      <ErrorBoundary showBackup>
        <ConnectedRouter history={history}>
          <Route component={App} />
        </ConnectedRouter>
      </ErrorBoundary>
    </I18n>
  );
};

const mapDispatchToProps = state => {
  return { locale: selectLocale(state.config) };
};

const ConnectedTranslatedApp = connect(mapDispatchToProps)(TranslatedApp);

function bootstrap(opts = {}) {
  const { config } = opts;

  /**
   * Log the version number.
   */
  if (typeof NETLIFY_CMS_CORE_VERSION === 'string') {
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
  const Root = () => {
    const isDark = window && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [isMobile, setIsMobile] = useState(isWindowDown('xs'));
    const handleResize = () => {
      // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      setIsMobile(isWindowDown('xs'));
    };

    useEffect(() => {
      window.addEventListener('resize', handleResize);
      handleResize();

      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <>
        <GlobalStyles />
        <ThemeProvider
          theme={isDark ? { darkMode: true, ...darkTheme } : { darkMode: false, ...lightTheme }}
        >
          <Provider store={store}>
            <ConnectedTranslatedApp />
          </Provider>
        </ThemeProvider>
      </>
    );
  };

  /**
   * Render application root.
   */
  render(<Root />, getRoot());
}

export default bootstrap;
