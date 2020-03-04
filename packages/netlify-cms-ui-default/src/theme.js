import * as responsive from './utils/responsive';
import color from './utils/color';

const fonts = {
  sansSerif: `
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif,
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol"
  `,
  serif: `
    'Charter',
    serif
  `,
  mono: `
    'SFMono-Regular',
    Consolas,
    "Liberation Mono",
    Menlo,
    Courier,
    monospace;
  `,
};

export const lightTheme = {
  fontFamily: fonts.sansSerif,
  fonts,
  responsive,
  color: {
    ...color,
    primary: color.turquoise,
    secondary: color.turquoise,
    danger: color.red,
    success: color.turquoise,
    text: color.neutral['800'],
    label: color.neutral['500'],
    alternateBackground: color.neutral['50'],
    background: color.neutral['100'],
    surface: 'white',
    surfaceHighlight: color.neutral['100'],
    elevatedSurface: 'white',
    elevatedSurfaceHighlight: color.neutral['100'],
    border: color.neutral['300'],
    buttonPressed: color.neutral['800'],
    button: color.neutral['700'],
    buttonHover: color.neutral['600'],
    disabled: color.neutral['400'],
    lowEmphasis: color.neutral['600'],
    mediumEmphasis: color.neutral['800'],
    highEmphasis: color.neutral['1400'],
  },
};

export const darkTheme = {
  fontFamily: fonts.sansSerif,
  fonts,
  responsive,
  color: {
    ...color,
    responsive,
    primary: color.turquoise,
    secondary: color.turquoise,
    danger: color.red,
    success: color.turquoise,
    text: color.neutral['100'],
    label: color.neutral['500'],
    alternateBackground: color.neutral['1600'],
    background: color.neutral['1600'],
    surface: color.neutral['1500'],
    surfaceHighlight: color.neutral['1300'],
    elevatedSurface: color.neutral['1400'],
    elevatedSurfaceHighlight: color.neutral['1200'],
    border: color.neutral['1200'],
    buttonPressed: color.neutral['1100'],
    button: color.neutral['1000'],
    buttonHover: color.neutral['900'],
    disabled: color.neutral['800'],
    lowEmphasis: color.neutral['500'],
    mediumEmphasis: color.neutral['300'],
    highEmphasis: color.neutral['100'],
  },
};
