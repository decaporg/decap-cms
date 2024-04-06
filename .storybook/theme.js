import { lightTheme, darkTheme } from 'decap-cms-ui-next';

export default {
  light: {
    colorPrimary: lightTheme.color.primary['900'],
    colorSecondary: lightTheme.color.primary['900'],

    // UI
    appBg: lightTheme.color.background,
    appContentBg: lightTheme.color.surface,
    appPreviewBg: lightTheme.color.surface,
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

    brandTitle: 'Decap CMS',
    brandUrl: 'https://decapcms.org',
    brandImage: 'https://decapcms.org/img/decap-logo.svg',
  },

  dark: {
    colorPrimary: darkTheme.color.primary['900'],
    colorSecondary: darkTheme.color.primary['900'],

    // UI
    appBg: darkTheme.color.background,
    appContentBg: darkTheme.color.surface,
    appPreviewBg: darkTheme.color.surface,
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

    brandTitle: 'Decap CMS',
    brandUrl: 'https://decapcms.org',
    brandImage: 'https://decapcms.org/img/decap-logo.svg',
  },
};
