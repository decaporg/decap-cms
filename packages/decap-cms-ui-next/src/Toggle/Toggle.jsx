import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import color from 'color';

import { Button } from '../Buttons';

const StyledButton = styled(Button)`
  ${({ theme, active }) => css`
    color: ${active ? theme.color.primary['900'] : theme.color.highEmphasis};
    background-color: ${active
      ? color(theme.color.primary['900']).alpha(0.1).string()
      : 'transparent'} !important;
  `}

  &:hover,
  &:focus {
    color: ${({ theme, active }) =>
      active ? theme.color.primary['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.primary['900']).alpha(0.2).string()
        : color(theme.color.highEmphasis).alpha(0.05).string()} !important;
  }
`;

function Toggle({ icon, hasMenu, pressed, onPressedChange, disabled, children }) {
  return (
    <StyledButton
      icon={icon}
      hasMenu={hasMenu}
      active={pressed}
      disabled={disabled}
      onClick={event => onPressedChange(event)}
    >
      {children}
    </StyledButton>
  );
}

export default Toggle;
