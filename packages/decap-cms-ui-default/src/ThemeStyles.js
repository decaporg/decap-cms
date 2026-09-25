import React from 'react';
import PropTypes from 'prop-types';
import { css, Global } from '@emotion/react';

import { buildThemeCssVars } from './themeTokens';

/**
 * Injects CSS custom properties for the active theme.
 * Renders after GlobalStyles so config overrides win over defaults.
 */
function ThemeStyles({ theme }) {
  const vars = buildThemeCssVars(theme);

  return (
    <Global
      styles={css`
        :root {
          ${vars}
        }
      `}
    />
  );
}

ThemeStyles.propTypes = {
  theme: PropTypes.object,
};

export default ThemeStyles;
