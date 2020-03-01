import React, { useState, useEffect } from 'react';
import addons from '@storybook/addons';
import { addDecorator, addParameters } from '@storybook/react';
import { themes } from '@storybook/theming';
import { ThemeProvider } from 'emotion-theming';
import { lightTheme, darkTheme } from '../packages/netlify-cms-ui-default/src/theme';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import './preview.css';

const themeViewports = {
  sm: {
    name: 'Mobile (sm)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.sm}px`,
      height: '100%',
    },
    type: 'mobile',
  },
  md: {
    name: 'Tablet (md)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.md}px`,
      height: '100%',
    },
    type: 'tablet',
  },
  lg: {
    name: 'Laptop (lg)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.lg}px`,
      height: '100%',
    },
    type: 'desktop',
  },
  xl: {
    name: 'Desktop (xl)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.xl}px`,
      height: '100%',
    },
    type: 'desktop',
  },
};

addParameters({
  options: {
    /**
     * display the top-level grouping as a "root" in the sidebar
     * @type {Boolean}
     */
    showRoots: true,
    /**
     * sidebar tree animations
     * @type {Boolean}
     */
    sidebarAnimations: true,
  },
  viewport: {
    viewports: {
      ...themeViewports,
      ...INITIAL_VIEWPORTS,
    },
  },
  darkMode: {
    // Override the default dark theme
    dark: {
      ...themes.dark,
      colorPrimary: darkTheme.color.primary['500'],
      colorSecondary: darkTheme.color.primary['500'],

      // UI
      appBg: darkTheme.color.background,
      appContentBg: darkTheme.color.surface,
      appBorderColor: darkTheme.color.border,
      appBorderRadius: 4,

      // Typography
      fontBase: darkTheme.fontFamily,
      fontCode: 'monospace',

      // Text colors
      textColor: darkTheme.color.highEmphasis,
      textInverseColor: darkTheme.color.surface,
      // Toolbar default and active colors
      barTextColor: darkTheme.color.mediumEmphasis,
      barSelectedColor: darkTheme.color.highEmphasis,
      barBg: darkTheme.color.elevatedSurface,

      // Form colors
      inputBg: darkTheme.color.background,
      inputBorder: darkTheme.color.border,
      inputTextColor: darkTheme.color.highEmphasis,
      inputBorderRadius: 4,

      brandTitle: 'Netlify CMS',
      brandUrl: 'https://netlifycms.org',
      brandImage: 'https://www.netlify.com/img/press/logos/full-logo-dark.png',
    },
    // Override the default light theme
    light: {
      ...themes.normal,
      colorPrimary: lightTheme.color.primary['500'],
      colorSecondary: lightTheme.color.primary['500'],

      // UI
      appBg: lightTheme.color.background,
      appContentBg: lightTheme.color.surface,
      appBorderColor: lightTheme.color.border,
      appBorderRadius: 4,

      // Typography
      fontBase: lightTheme.fontFamily,
      fontCode: 'monospace',

      // Text colors
      textColor: lightTheme.color.highEmphasis,
      textInverseColor: lightTheme.color.surface,
      // Toolbar default and active colors
      barTextColor: lightTheme.color.mediumEmphasis,
      barSelectedColor: lightTheme.color.highEmphasis,
      barBg: lightTheme.color.elevatedSurface,

      // Form colors
      inputBg: 'white',
      inputBorder: lightTheme.color.border,
      inputTextColor: lightTheme.color.highEmphasis,
      inputBorderRadius: 4,

      brandTitle: 'Netlify CMS',
      brandUrl: 'https://netlifycms.org',
      brandImage: 'https://www.netlify.com/img/press/logos/full-logo-light.png',
    },
  },
});

// get channel to listen to event emitter
const channel = addons.getChannel();

// create a component that listens for the DARK_MODE event
function ThemeWrapper(props) {
  const [isDark, setDark] = useState(false);

  useEffect(() => {
    // listen to DARK_MODE event
    channel.on('DARK_MODE', setDark);
    return () => channel.off('DARK_MODE', setDark);
  }, [channel, setDark]);

  // render your custom theme provider
  return (
    <ThemeProvider
      theme={isDark ? { darkMode: true, ...darkTheme } : { darkMode: false, ...lightTheme }}
    >
      {props.children}
    </ThemeProvider>
  );
}

const fill = { height: '100%', width: '100%' };
const center = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

addDecorator(renderStory => (
  <ThemeWrapper>
    <div style={{ ...fill, ...center }}>{renderStory()}</div>
  </ThemeWrapper>
));
