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
  const [appBarStart, setAppBarStart] = useState();
  const [appBarEnd, setAppBarEnd] = useState();

  return (
    <UIContext.Provider
      value={{
        appBarStart,
        setAppBarStart,
        appBarEnd,
        setAppBarEnd,
        darkMode,
        setDarkMode,
        navCollapsed,
        setNavCollapsed,
        pageTitle,
        setPageTitle,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
