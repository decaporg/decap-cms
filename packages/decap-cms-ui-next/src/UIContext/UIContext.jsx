import React, { createContext, useState } from 'react';

import { useLocalStorageState } from '../hooks';

export const UIContext = createContext({
  appBarStart: () => null,
  renderAppBarStart: () => {},
  appBarEnd: () => null,
  renderAppBarEnd: () => {},
  darkMode: false,
  setDarkMode: () => {},
  navCollapsed: false,
  setNavCollapsed: () => {},
  pageTitle: '',
  setPageTitle: () => {},
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export function UIProvider({ value, children }) {
  const { darkMode: initialDarkMode } = value;

  const [darkMode, setDarkMode] = useLocalStorageState(
    'darkMode',
    initialDarkMode !== undefined
      ? initialDarkMode
      : window && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  if (initialDarkMode !== undefined && initialDarkMode !== darkMode) {
    setDarkMode(initialDarkMode);
  }

  const [navCollapsed, setNavCollapsed] = useLocalStorageState('navCollapsed', false);
  const [pageTitle, setPageTitle] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
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
