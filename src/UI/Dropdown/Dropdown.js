import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../../../icons/Icon';
import { Wrapper, Button, Menu, MenuItem } from 'react-aria-menubutton';

const Dropdown = ({ label, button, children }) => (
  <Wrapper className="nc-dropdown" onSelection={handler => handler()}>
    {
      button
        ? <Button>{button}</Button>
        : <Button className="nc-dropdownButton">{label}</Button>
    }
    <Menu>
      <ul className="nc-dropdownList">
        {children}
      </ul>
    </Menu>
  </Wrapper>
);

const DropdownItem = ({ label, icon, iconDirection, onClick }) => (
  <MenuItem className="nc-dropdownItem" value={onClick}>
    <span>{label}</span>
    <span className="nc-dropdownItemIcon">
      { icon ? <Icon type={icon} direction={iconDirection} size="small"/> : null }
    </span>
  </MenuItem>
);


export { Dropdown, DropdownItem };
