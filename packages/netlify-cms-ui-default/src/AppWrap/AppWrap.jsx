import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'emotion-theming';
import styled from '@emotion/styled';
import { lightTheme, darkTheme } from '../packages/netlify-cms-ui-default/src/theme';
import { ToastContainer } from '../Toast';
import GlobalStyles from '../GlobalStyles';
import NavigationMenu from '../NavigationMenu';
import AppBar from '../AppBar';

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

const AppWrap = ({ children }) => {
  const [isDark, setDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
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
    <ThemeProvider
      theme={isDark ? { darkMode: true, ...darkTheme } : { darkMode: false, ...lightTheme }}
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
  );
};

export default AppWrap;
