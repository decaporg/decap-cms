import React from 'react';
import { Global, css } from '@emotion/core';
import color from 'color';
import { withTheme } from 'emotion-theming';
import interTypeface from 'typeface-inter/inter.css';

const getGlobalStyles = theme => css`
  html {
    box-sizing: border-box;
  }
  *,
  *:before,
  *:after {
    box-sizing: inherit;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }

  *::selection {
    background-color: ${color(theme.color.success['900'])
      .alpha(0.3)
      .string()};
    color: ${theme.color.success[theme.darkMode ? '200' : '1500']};
  }

  ${interTypeface}

  html,
  body {
    font-family: ${theme.fontFamily};
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
    color: ${theme.color.neutral['800']};
    background: ${theme.color.background};
    height: 100%;
  }

  #root {
    height: 100%;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  ul,
  ol {
    margin-top: 0;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: ${theme.color.highEmphasis};
  }

  p {
    color: ${theme.color.mediumEmphasis};
    margin-bottom: 24px;
  }

  a {
    color: ${theme.color.primary['1500']};
    text-decoration: none;
  }

  #nc-root {
    height: 100%;
  }
`;

const GlobalStyles = ({ theme }) => <Global styles={getGlobalStyles(theme)} />;

export default withTheme(GlobalStyles);
