import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import color from 'color';
import { Tooltip, Button } from 'decap-cms-ui-next';

const StyledButton = styled(Button)`
  ${({ theme, active }) => css`
    color: ${active ? theme.color.success['900'] : theme.color.highEmphasis};
    background-color: ${active
      ? color(theme.color.success['900']).alpha(0.1).string()
      : 'transparent'} !important;
  `}

  &:hover,
  &:focus {
    color: ${({ theme, active }) =>
      active ? theme.color.success['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['900']).alpha(0.2).string()
        : color(theme.color.highEmphasis).alpha(0.05).string()} !important;
  }
`;

function ToolbarButton({ children, type, label, icon, hasMenu, onClick, isActive, disabled }) {
  return (
    <Tooltip label={label} enterDelay={1000}>
      <div>
        <StyledButton
          active={isActive}
          disabled={disabled}
          onClick={event => onClick && onClick(event, type)}
          icon={icon}
          hasMenu={hasMenu}
        >
          {children}
        </StyledButton>
      </div>
    </Tooltip>
  );
}

ToolbarButton.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ToolbarButton;
