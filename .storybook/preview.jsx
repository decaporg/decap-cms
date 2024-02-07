import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { Global, css, ThemeProvider } from '@emotion/react';
import {
  lightTheme,
  darkTheme,
  UIProvider,
  useUIContext,
  GlobalStyles,
} from 'decap-cms-ui-next/src';

export const parameters = {
  layout: 'centered',
};

export const decorators = [
  withThemeFromJSXProvider({
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
    defaultTheme: 'light',
    Provider: ThemeProvider,
    GlobalStyles,
  }),
];
