import React, { useEffect } from 'react';
import { ThemeProvider } from 'emotion-theming';
import styled from '@emotion/styled';
import { lightTheme, darkTheme } from '../theme';
import { ToastContainer } from '../Toast';
import GlobalStyles from '../GlobalStyles';
import { NavMenu } from '../NavMenu';
import AppBar from '../AppBar';
import { UIContext, UIProvider } from '../UIContext';

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
    <UIProvider>
      <UIContext.Consumer>
        {({ darkMode }) => (
          <ThemeProvider
            theme={darkMode ? { darkMode, ...darkTheme } : { darkMode, ...lightTheme }}
          >
            <GlobalStyles />
            <AppOuter>
              <AppBar />
              <AppBody>
                <NavMenu />
                <AppContent>{children}</AppContent>
              </AppBody>
              <ToastContainer />
            </AppOuter>
          </ThemeProvider>
        )}
      </UIContext.Consumer>
    </UIProvider>
  );
};

export default AppWrap;
