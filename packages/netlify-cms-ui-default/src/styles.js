import { css } from '@emotion/core';

/**
 * Font Stacks
 */
const fonts = {
  primary: `
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

const shadows = {
  dropDeep: `
    box-shadow: 0 4px 12px 0 rgba(68, 74, 87, 0.15), 0 1px 3px 0 rgba(68, 74, 87, 0.25);
  `,
};

const buttons = {
  button: css`
    border: 0;
    cursor: pointer;
  `,
  default: css`
    height: 36px;
    line-height: 36px;
    font-weight: 500;
    padding: 0 15px;
  `,
};

export { fonts, buttons, shadows };
