import React from 'react';
import { DocsContainer } from '@storybook/addon-docs';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';
import { ThemeProvider } from '@emotion/react';
import { lightTheme, darkTheme, UIProvider, GlobalStyles } from 'decap-cms-ui-next/src';
import themeViewports from './viewports';
import brandTheme from './theme';

function ThemeWrapper({ children }) {
  const darkMode = useDarkMode();
  const theme = darkMode ? { darkMode, ...darkTheme } : { darkMode, ...lightTheme };

  return (
    <UIProvider value={{ darkMode }}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {children}
      </ThemeProvider>
    </UIProvider>
  );
}

export const parameters = {
  layout: 'centered',
  viewport: {
    viewports: {
      ...themeViewports,
    },
  },
  actions: { argTypesRegex: '^on.*' },
  options: {
    showPanel: true,
    storySort: {
      method: 'alphabetical',
      order: ['Foundations', 'Pages', 'Components', 'Fields'],
    },
  },
  deepControls: { enabled: true },
  darkMode: {
    dark: { ...themes.dark, ...brandTheme.dark },
    light: { ...themes.normal, ...brandTheme.light },
  },
  docs: {
    container: props => {
      const isDark = useDarkMode();
      const currentProps = { ...props };
      currentProps.theme = isDark
        ? { ...themes.dark, ...brandTheme.dark }
        : { ...themes.normal, ...brandTheme.light };
      return React.createElement(DocsContainer, currentProps);
    },
  },
};

export const decorators = [renderStory => <ThemeWrapper>{renderStory()}</ThemeWrapper>];
