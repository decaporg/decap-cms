import React from 'react';
import { Global, css, withTheme } from '@emotion/react';

function getColorPickerStyles(theme) {
  return css`
    .react-colorful .react-colorful__pointer {
      /* border: 2px solid ${theme.color.emphasis}; */
    }

    .react-colorful .react-colorful__pointer.react-colorful__saturation-pointer {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .react-colorful .react-colorful__pointer.react-colorful__hue-pointer,
    .react-colorful .react-colorful__pointer.react-colorful__alpha-pointer {
      width: 16px;
      border-radius: 4px;
    }
  `;
}

function getDatetimePickerStyles({ theme }) {
  return <Global styles={getColorPickerStyles(theme)} />;
}

export default withTheme(getDatetimePickerStyles);
