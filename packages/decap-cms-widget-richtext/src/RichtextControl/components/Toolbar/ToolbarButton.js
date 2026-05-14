import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons } from 'decap-cms-ui-default';

const StyledToolbarButton = styled.button`
  ${buttons.button};
  display: inline-block;
  padding: 4px;
  margin: 2px;
  border: none;
  background-color: ${props => (props.isActive ? '#e8f5fe' : 'transparent')};
  font-size: 16px;
  color: ${props => (props.isActive ? '#3a69c7' : 'inherit')};
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
      onMouseDown={e => e.preventDefault()}
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
