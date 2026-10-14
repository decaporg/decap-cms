import { css, Global } from '@emotion/react';

/**
 * Font Stacks
 */
const fonts = {
  primary: `
    system-ui,
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
  mono: `
    'SFMono-Regular',
    Consolas,
    "Liberation Mono",
    Menlo,
    Courier,
    monospace;
  `,
};

/**
 * Theme Colors
 */
const colorsRaw = {
  white: '#fff',
  grayLight: '#eff0f4',
  gray: '#798291',
  grayDark: '#313d3e',
  blue: '#3a69c7',
  blueLight: '#e8f5fe',
  green: '#005614',
  greenLight: '#caef6f',
  brown: '#754e00',
  yellow: '#ffee9c',
  red: '#ff003b',
  redDark: '#D60032',
  redLight: '#fcefea',
  purple: '#70399f',
  purpleLight: '#f6d8ff',
  teal: '#17a2b8',
  tealDark: '#117888',
  tealLight: '#ddf5f9',
};

/**
 * Semantic colors, as [light, dark] pairs. Each one is exposed as a CSS custom
 * property with the light value as its fallback, so a component renders as it
 * always has wherever the properties are not defined (the preview pane, a
 * widget used on its own). `GlobalStyles` redefines them for a dark system
 * colour scheme.
 */
const themeColors = {
  statusDraftText: [colorsRaw.purple, '#cfa6f5'],
  statusDraftBackground: [colorsRaw.purpleLight, '#3a2552'],
  statusReviewText: [colorsRaw.brown, '#f0c674'],
  statusReviewBackground: [colorsRaw.yellow, '#40350f'],
  statusReadyText: [colorsRaw.green, '#a5e065'],
  statusReadyBackground: [colorsRaw.greenLight, '#21401c'],
  text: [colorsRaw.gray, '#9aa4b2'],
  textLight: [colorsRaw.white, colorsRaw.white],
  textLead: [colorsRaw.grayDark, '#e6e9ee'],
  textStrong: ['#1e2532', '#f3f5f8'],
  logoText: ['#000', '#f3f5f8'],
  background: [colorsRaw.grayLight, '#15171c'],
  foreground: [colorsRaw.white, '#22262e'],
  accentBackground: [colorsRaw.grayLight, '#323743'],
  active: [colorsRaw.blue, '#7aa5f5'],
  activeBackground: [colorsRaw.blueLight, '#1f3050'],
  hoverBackground: ['#f1f2f4', '#2d323b'],
  inactive: [colorsRaw.gray, '#9aa4b2'],
  border: ['#eaebf1', '#343944'],
  button: [colorsRaw.grayDark, '#434a59'],
  buttonText: [colorsRaw.white, colorsRaw.white],
  disabledBackground: [colorsRaw.grayLight, '#2a2e37'],
  inputBackground: [colorsRaw.white, '#1b1e25'],
  inputText: ['#444a57', '#e6e9ee'],
  selectText: ['hsl(0, 0%, 20%)', '#e6e9ee'],
  infoText: [colorsRaw.blue, '#7aa5f5'],
  infoBackground: [colorsRaw.blueLight, '#1f3050'],
  successText: [colorsRaw.green, '#a5e065'],
  successBackground: [colorsRaw.greenLight, '#21401c'],
  warnText: [colorsRaw.brown, '#f0c674'],
  warnBackground: [colorsRaw.yellow, '#40350f'],
  errorText: [colorsRaw.red, '#ff6685'],
  errorBackground: [colorsRaw.redLight, '#451b23'],
  dangerText: [colorsRaw.redDark, '#ff8aa1'],
  badgeDangerBackground: ['#fbe0d7', '#451b23'],
  tealText: [colorsRaw.tealDark, '#6ad6e8'],
  tealButtonText: ['#1195aa', '#6ad6e8'],
  tealBackground: [colorsRaw.tealLight, '#143d46'],
  textFieldBorder: ['#dfdfe3', '#3b404b'],
  controlLabel: ['#5D626F', '#a9b1bf'],
  checkerboardLight: ['#f2f2f2', '#2b2f38'],
  checkerboardDark: ['#e6e6e6', '#22262e'],
  mediaDraftText: [colorsRaw.purple, '#cfa6f5'],
  mediaDraftBackground: [colorsRaw.purpleLight, '#3a2552'],
};

function colorProperty(name) {
  return `--decap-color-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
}

const colors = Object.fromEntries(
  Object.entries(themeColors).map(([name, [light]]) => [
    name,
    `var(${colorProperty(name)}, ${light})`,
  ]),
);

const darkColorProperties = Object.entries(themeColors)
  .map(([name, [, dark]]) => `${colorProperty(name)}: ${dark};`)
  .join('\n');

const lengths = {
  topBarHeight: '56px',
  inputPadding: '16px 20px',
  borderRadius: '5px',
  richTextEditorMinHeight: '300px',
  borderWidth: '2px',
  topCardWidth: '682px',
  pageMargin: '28px 18px',
  pageMarginMobile: '12px 8px',
  objectWidgetTopBarContainerPadding: '0 14px 14px',
};

const borders = {
  textField: `solid  ${lengths.borderWidth} ${colors.textFieldBorder}`,
};

const transitions = {
  main: '.2s ease',
};

const shadows = {
  drop: `
    box-shadow: 0 2px 4px 0 rgba(19, 39, 48, 0.12);
  `,
  dropMain: `
    box-shadow: 0 2px 6px 0 rgba(68, 74, 87, 0.05), 0 1px 3px 0 rgba(68, 74, 87, 0.1);
  `,
  dropMiddle: `
    box-shadow: 0 2px 6px 0 rgba(68, 74, 87, 0.15), 0 1px 3px 0 rgba(68, 74, 87, 0.3);
  `,
  dropDeep: `
    box-shadow: 0 4px 12px 0 rgba(68, 74, 87, 0.15), 0 1px 3px 0 rgba(68, 74, 87, 0.25);
  `,
  inset: `
    box-shadow: inset 0 0 4px rgba(68, 74, 87, 0.3);
  `,
};

const text = {
  fieldLabel: css`
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 600;
    color: ${colors.controlLabel};
  `,
};

const gradients = {
  checkerboard: `
    linear-gradient(
      45deg,
      ${colors.checkerboardDark} 25%,
      transparent 25%,
      transparent 75%,
      ${colors.checkerboardDark} 75%,
      ${colors.checkerboardDark}
    )
  `,
};

const effects = {
  checkerboard: css`
    background-color: ${colors.checkerboardLight};
    background-size: 16px 16px;
    background-position: 0 0, 8px 8px;
    background-image: ${gradients.checkerboard}, ${gradients.checkerboard};
  `,
};

const badge = css`
  font-size: 13px;
  line-height: 1;
`;

const backgroundBadge = css`
  ${badge};
  display: block;
  border-radius: ${lengths.borderRadius};
  padding: 4px 10px;
  text-align: center;
`;

const textBadge = css`
  ${badge};
  display: inline-block;
  font-weight: 700;
  text-transform: uppercase;
`;

const card = css`
  ${shadows.dropMain};
  border-radius: 5px;
  background-color: ${colors.foreground};
`;

const buttons = {
  button: css`
    border: 0;
    border-radius: ${lengths.borderRadius};
    cursor: pointer;
  `,
  default: css`
    height: 36px;
    line-height: 36px;
    font-weight: 500;
    padding: 0 15px;
    background-color: ${colorsRaw.gray};
    color: ${colorsRaw.white};
  `,
  widget: css`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px 12px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 3px;
  `,
  medium: css`
    height: 27px;
    line-height: 27px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 3px;
    padding: 0 24px 0 14px;
  `,
  small: css`
    font-size: 13px;
    height: 23px;
    line-height: 23px;
  `,
  gray: css`
    background-color: ${colors.button};
    color: ${colors.buttonText};

    &:focus,
    &:hover {
      color: ${colorsRaw.white};
      background-color: #555a65;
    }
  `,
  grayText: css`
    background-color: transparent;
    color: ${colors.text};
  `,
  green: css`
    background-color: #aae31f;
    color: ${colorsRaw.green};
  `,
  lightRed: css`
    background-color: ${colors.errorBackground};
    color: ${colors.dangerText};
  `,
  lightBlue: css`
    background-color: ${colors.activeBackground};
    color: ${colors.active};
  `,
  lightTeal: css`
    background-color: ${colors.tealBackground};
    color: ${colors.tealButtonText};
  `,
  teal: css`
    background-color: ${colorsRaw.teal};
    color: ${colorsRaw.white};
  `,
  disabled: css`
    background-color: ${colors.disabledBackground};
    color: ${colors.text};
    cursor: default;
  `,
};

const caret = css`
  color: ${colorsRaw.white};
  width: 0;
  height: 0;
  border: 5px solid transparent;
  border-radius: 2px;
`;

const components = {
  card,
  caretDown: css`
    ${caret};
    border-top: 6px solid currentColor;
    border-bottom: 0;
  `,
  caretRight: css`
    ${caret};
    border-left: 6px solid currentColor;
    border-right: 0;
  `,
  badge: css`
    ${backgroundBadge};
    color: ${colors.infoText};
    background-color: ${colors.infoBackground};
  `,
  badgeSuccess: css`
    ${backgroundBadge};
    color: ${colors.successText};
    background-color: ${colors.successBackground};
  `,
  badgeDanger: css`
    ${backgroundBadge};
    color: ${colors.errorText};
    background-color: ${colors.badgeDangerBackground};
  `,
  textBadge: css`
    ${textBadge};
    color: ${colors.infoText};
  `,
  textBadgeSuccess: css`
    ${textBadge};
    color: ${colors.successText};
  `,
  textBadgeDanger: css`
    ${textBadge};
    color: ${colors.errorText};
  `,
  loaderSize: css`
    width: 2.2857rem;
    height: 2.2857rem;
  `,
  cardTop: css`
    ${card};
    width: ${lengths.topCardWidth};
    max-width: 100%;
    padding: 18px 20px;
    margin-bottom: 22px;
  `,
  cardTopHeading: css`
    font-size: 20px;
    line-height: 24px;
    @media (min-width: 500px) {
      font-size: 22px;
      line-height: 26px;
    }
    font-weight: 600;
    margin: 0;
    padding: 0;
  `,
  cardTopDescription: css`
    max-width: 480px;
    color: ${colors.text};
    font-size: 14px;
    margin-top: 8px;
    margin-bottom: 0;
  `,
  objectWidgetTopBarContainer: css`
    padding: ${lengths.objectWidgetTopBarContainerPadding};
  `,
  dropdownList: css`
    ${shadows.dropDeep};
    background-color: ${colors.foreground};
    border-radius: ${lengths.borderRadius};
    overflow: hidden;
  `,
  dropdownItem: css`
    ${buttons.button};
    background-color: transparent;
    border-radius: 0;
    color: ${colors.textLead};
    font-weight: 500;
    border-bottom: 1px solid ${colors.border};
    padding: 8px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: max-content;

    &:last-of-type {
      border-bottom: 0;
    }

    &.active,
    &:hover,
    &:active,
    &:focus {
      color: ${colors.active};
      background-color: ${colors.activeBackground};
    }
  `,
  viewControlsText: css`
    font-size: 14px;
    color: ${colors.text};
    margin-right: 12px;
    white-space: nowrap;
  `,
};

const reactSelectStyles = {
  control: styles => ({
    ...styles,
    border: 0,
    boxShadow: 'none',
    backgroundColor: colors.inputBackground,
    padding: '9px 0 9px 12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  option: (styles, state) => ({
    ...styles,
    backgroundColor: state.isSelected
      ? `${colors.active}`
      : state.isFocused
      ? `${colors.activeBackground}`
      : 'transparent',
    color: state.isSelected ? colors.textLight : 'inherit',
    paddingLeft: '22px',
  }),
  menu: styles => ({
    ...styles,
    right: 0,
    zIndex: zIndex.zIndex300,
    backgroundColor: colors.foreground,
  }),
  singleValue: styles => ({ ...styles, color: colors.selectText }),
  input: styles => ({ ...styles, color: colors.selectText }),
  container: styles => ({ ...styles, padding: '0 !important' }),
  indicatorSeparator: (styles, state) =>
    state.hasValue && state.selectProps.isClearable
      ? { ...styles, backgroundColor: `${colors.textFieldBorder}` }
      : { display: 'none' },
  dropdownIndicator: styles => ({ ...styles, color: `${colors.controlLabel}` }),
  clearIndicator: styles => ({ ...styles, color: `${colors.controlLabel}` }),
  multiValue: styles => ({
    ...styles,
    backgroundColor: colors.accentBackground,
  }),
  multiValueLabel: styles => ({
    ...styles,
    color: colors.textLead,
    fontWeight: 500,
  }),
  multiValueRemove: styles => ({
    ...styles,
    color: colors.controlLabel,
    ':hover': {
      color: colors.errorText,
      backgroundColor: colors.errorBackground,
    },
  }),
};

const zIndex = {
  zIndex0: 0,
  zIndex1: 1,
  zIndex2: 2,
  zIndex10: 10,
  zIndex100: 100,
  zIndex200: 200,
  zIndex299: 299,
  zIndex300: 300,
  zIndex1000: 1000,
  zIndex10000: 10000,
  zIndex99999: 99999,
};

function GlobalStyles() {
  return (
    <Global
      styles={css`
        /**
         * Dark colour scheme. It follows the system setting; set
         * data-decap-theme="light" or "dark" on the root element to pin one.
         */
        @media (prefers-color-scheme: dark) {
          :root:not([data-decap-theme='light']) {
            color-scheme: dark;
            ${darkColorProperties}
          }
        }

        :root[data-decap-theme='dark'] {
          color-scheme: dark;
          ${darkColorProperties}
        }

        *,
        *:before,
        *:after {
          box-sizing: border-box;
        }

        :focus {
          outline: -webkit-focus-ring-color auto ${lengths.borderRadius};
        }

        /**
       * Don't show outlines if the user is utilizing mouse rather than keyboard.
       */
        [data-whatintent='mouse'] *:focus {
          outline: none;
        }

        input {
          border: 0;
        }

        body {
          font-family: ${fonts.primary};
          font-weight: normal;
          background-color: ${colors.background};
          color: ${colors.text};
          margin: 0;
        }

        ul,
        ol {
          padding-left: 0;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p {
          font-family: ${fonts.primary};
          color: ${colors.textLead};
          font-size: 15px;
          line-height: 1.5;
          margin-top: 0;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-weight: 500;
        }

        h1 {
          font-size: 24px;
          letter-spacing: 0.4px;
          color: ${colors.textLead};
        }

        a,
        button {
          font-size: 14px;
          font-weight: 500;
        }

        a {
          color: ${colors.text};
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        img {
          max-width: 100%;
        }

        textarea {
          resize: none;
        }
      `}
    />
  );
}

export {
  fonts,
  colorsRaw,
  colors,
  lengths,
  components,
  buttons,
  text,
  shadows,
  borders,
  transitions,
  effects,
  zIndex,
  reactSelectStyles,
  GlobalStyles,
};
