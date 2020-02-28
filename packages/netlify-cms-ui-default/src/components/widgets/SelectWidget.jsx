import React, { useState } from 'react';
import styled from '@emotion/styled';
import TextWidget from './TextWidget';
import Button from '../Button';
import IconButton from '../IconButton';
import { Menu, MenuItem } from '../Menu';

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 0;
  bottom: -0.5rem;
`;

const SelectWidget = ({ options, value, onChange, label, labelSingular, multiple, ...props }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElWidth, setAnchorElWidth] = useState();

  function handleOpenMenu(event) {
    setAnchorElWidth(`${event.currentTarget.offsetWidth}px`);
    setAnchorEl(event.currentTarget);
  }

  function handleClose(value) {
    if (value && typeof value === 'string') {
      onChange(value);
    }
    setAnchorEl(null);
  }

  const selection = options.find(option => option.name === value);

  return (
    <div>
      <TextWidget
        {...props}
        readOnly
        label={multiple ? label : labelSingular}
        placeholder={
          multiple
            ? label
              ? `Select ${label}`
              : 'Select multiple'
            : labelSingular
            ? `Select a ${labelSingular}`
            : 'Select one'
        }
        onClick={handleOpenMenu}
        focused={!!anchorEl}
        value={options && selection && selection.label}
      >
        <StyledIconButton
          disabled={!options}
          onClick={handleOpenMenu}
          icon="chevron-down"
          active={!!anchorEl}
        />
      </TextWidget>
      {options && (
        <Menu
          anchorOrigin={{ x: 'center', y: 'bottom' }}
          transformOrigin={{ x: 'center', y: 'top' }}
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={handleClose}
          width={anchorElWidth}
        >
          {options.map(option => (
            <MenuItem
              selected={value === option.name}
              onClick={() => handleClose(option.name)}
              key={option.name}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
};

export default SelectWidget;
