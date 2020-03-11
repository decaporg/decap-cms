import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'emotion-theming';
import styled from '@emotion/styled';
import { lightTheme, darkTheme } from '../theme';
import { ToastContainer } from '../Toast';
import GlobalStyles from '../GlobalStyles';
import NavigationMenu from '../NavigationMenu';
import AppBar from '../AppBar';
import { useLocalStorageState } from '../hooks'

const AppOuter = styled.div`
  padding-top: 3.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const AppBody = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    flex-direction: column-reverse;
  }
`;
const AppContent = styled.div`
  flex: 1;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
`;

export const UIContext = React.createContext();
export const UIContextProvider = ({children}) => {
  const [darkMode, setDarkMode] = useLocalStorageState('darkMode', window && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
        setPageTitle
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

const AppWrap = ({ children }) => {
  const handleResize = () => {
    const vh = window.innerHeight * 0.01;

    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <UIContextProvider>
      <UIContext.Consumer>
        {({darkMode}) => (
          <ThemeProvider
            theme={darkMode ? { darkMode, ...darkTheme } : { darkMode, ...lightTheme }}
          >
            <GlobalStyles />
            <AppOuter>
              <AppBar />
              <AppBody>
                <NavigationMenu />
                <AppContent>{children}</AppContent>
              </AppBody>
              <ToastContainer />
            </AppOuter>
          </ThemeProvider>
        )}
      </UIContext.Consumer>
    </UIContextProvider>
  );
};

export default AppWrap;
