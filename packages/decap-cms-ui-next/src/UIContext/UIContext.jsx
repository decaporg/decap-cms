import React, { createContext, useState } from 'react';

import { useLocalStorageState } from '../hooks';

export const UIContext = createContext();

export function UIProvider({ children }) {
  const [darkMode, setDarkMode] = useLocalStorageState(
    'darkMode',
    window && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [navCollapsed, setNavCollapsed] = useLocalStorageState('navCollapsed', false);
  const [pageTitle, setPageTitle] = useState();
  const [breadcrumbs, setBreadcrumbs] = useState();
  const [appBarStart, setAppBarStart] = useState(() => () => null);
  const [appBarEnd, setAppBarEnd] = useState(() => () => null);

  function renderAppBarStart(fn) {
    setAppBarStart(() => fn);
  }
  function renderAppBarEnd(fn) {
    setAppBarEnd(() => fn);
  }

  return (
    <UIContext.Provider
      value={{
        appBarStart,
        renderAppBarStart,
        appBarEnd,
        renderAppBarEnd,
        darkMode,
        setDarkMode,
        navCollapsed,
        setNavCollapsed,
        pageTitle,
        setPageTitle,
        breadcrumbs,
        setBreadcrumbs,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function withUIContext(Component) {
  return props => (
    <UIContext.Consumer>{context => <Component {...props} {...context} />}</UIContext.Consumer>
  );
}

export default withUIContext(UIProvider);
