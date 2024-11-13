import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons } from 'decap-cms-ui-default';

const StyledToolbarButton = styled.button`
  ${buttons.button};
  display: inline-block;
  padding: clamp(3px, 0.6vw, 6px);
  border: none;
  background-color: transparent;
  font-size: clamp(13px, 1.6vw, 16px);
  color: ${props => (props.isActive ? '#1e2532' : 'inherit')};
  cursor: pointer;

  &:disabled {
    cursor: auto;
    opacity: 0.5;
  }

  ${Icon} {
    display: block;
  }
`;

function ToolbarButton({ type, label, icon, onClick, isActive, disabled }) {
  return (
    <StyledToolbarButton
      isActive={isActive}
      onClick={e => onClick && onClick(e, type)}
      title={label}
      disabled={disabled}
    >
      {icon ? <Icon type={icon} /> : label}
    </StyledToolbarButton>
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
