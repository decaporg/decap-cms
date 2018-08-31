import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'react-emotion';
import { Wrapper, Button as DropdownButton, Menu, MenuItem } from 'react-aria-menubutton';
import { buttons, components } from './styles';
import Icon from './Icon';

const StyledWrapper = styled(Wrapper)`
  position: relative;
  font-size: 14px;
  user-select: none;
`;

const StyledDropdownButton = styled(DropdownButton)`
  ${buttons.button};
  ${buttons.default};
  display: block;
  padding-left: 20px;
  padding-right: 40px;

  &:after {
    ${components.caretDown};
    content: '';
    display: block;
    position: absolute;
    top: 16px;
    right: 16px;
    color: currentColor;
  }
`;

const DropdownList = styled.ul`
  ${components.dropdownList};
  margin: 0;
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  z-index: 1;

  ${props => css`
    width: ${props.width};
    top: ${props.top};
    left: ${props.position === 'left' ? 0 : 'auto'};
    right: ${props.position === 'right' ? 0 : 'auto'};
  `};
`;

const StyledMenuItem = styled(MenuItem)`
  ${components.dropdownItem};
`;

const MenuItemIconContainer = styled.div`
  flex: 1 0 32px;
  text-align: right;
  position: relative;
  top: 2px;
`;

const Dropdown = ({
  renderButton,
  dropdownWidth = 'auto',
  dropdownPosition = 'left',
  dropdownTopOverlap = '0',
  className,
  children,
}) => {
  return (
    <StyledWrapper onSelection={handler => handler()} className={className}>
      {renderButton()}
      <Menu>
        <DropdownList width={dropdownWidth} top={dropdownTopOverlap} position={dropdownPosition}>
          {children}
        </DropdownList>
      </Menu>
    </StyledWrapper>
  );
};

Dropdown.propTypes = {
  renderButton: PropTypes.func.isRequired,
  dropdownWidth: PropTypes.string,
  dropdownPosition: PropTypes.string,
  dropdownTopOverlap: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

const DropdownItem = ({ label, icon, iconDirection, onClick, className }) => (
  <StyledMenuItem value={onClick} className={className}>
    <span>{label}</span>
    {icon ? (
      <MenuItemIconContainer>
        <Icon type={icon} direction={iconDirection} size="small" />
      </MenuItemIconContainer>
    ) : null}
  </StyledMenuItem>
);

DropdownItem.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  iconDirection: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export { Dropdown as default, DropdownItem, DropdownButton, StyledDropdownButton };
