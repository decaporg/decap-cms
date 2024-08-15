import React from 'react';
import { Preview } from '@storybook/react';
import { DocsContainer } from '@storybook/addon-docs';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';
import { ThemeProvider } from '@emotion/react';
import { I18n } from 'react-polyglot';
import { en } from 'decap-cms-locales';
import { lightTheme, darkTheme, UIProvider, GlobalStyles } from 'decap-cms-ui-next';
import themeViewports from './viewports';
import brandTheme from './theme';

const preview: Preview = {
  decorators: [
    Story => {
      const darkMode = useDarkMode();
      const theme = darkMode ? { darkMode, ...darkTheme } : { darkMode, ...lightTheme };

      return (
        <I18n locale="en" messages={en}>
          <UIProvider value={{ darkMode }}>
            <ThemeProvider theme={theme}>
              <GlobalStyles />

              <Story />
            </ThemeProvider>
          </UIProvider>
        </I18n>
      );
    },
  ],
  parameters: {
    layout: 'centered',
    viewport: {
      viewports: {
        ...themeViewports,
      },
    },
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
  },
};

export default preview;
