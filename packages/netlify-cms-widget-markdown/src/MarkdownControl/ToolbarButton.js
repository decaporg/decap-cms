import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons } from 'netlify-cms-ui-default';

const StyledToolbarButton = styled.button`
  ${buttons.button};
  display: inline-block;
  padding: 6px;
  border: none;
  background-color: transparent;
  font-size: 16px;
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

const ToolbarButton = ({ type, label, icon, onClick, isActive, isHidden, disabled }) => {
  if (isHidden) {
    return null;
  }

  return (
    <StyledToolbarButton
      isActive={isActive && type && isActive(type)}
      onClick={e => onClick && onClick(e, type)}
      title={label}
      disabled={disabled}
    >
      {icon ? <Icon type={icon} /> : label}
    </StyledToolbarButton>
  );
};

ToolbarButton.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  isActive: PropTypes.func,
  isHidden: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ToolbarButton;
