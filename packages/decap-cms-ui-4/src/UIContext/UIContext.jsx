import React, { createContext, useState } from 'react';
import { useLocalStorageState } from '../hooks';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useLocalStorageState(
    'darkMode',
    window && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [navCollapsed, setNavCollapsed] = useLocalStorageState('navCollapsed', false);
  const [pageTitle, setPageTitle] = useState();
  const [breadcrumbs, setBreadcrumbs] = useState();
  const [appBarStart, setAppBarStart] = useState(() => () => null);
  const [appBarEnd, setAppBarEnd] = useState(() => () => null);

  const renderAppBarStart = fn => setAppBarStart(() => fn);
  const renderAppBarEnd = fn => setAppBarEnd(() => fn);

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
};
