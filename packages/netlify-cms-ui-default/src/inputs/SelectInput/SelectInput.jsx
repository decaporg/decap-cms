import React, { useState } from 'react';
import styled from '@emotion/styled';
import TextInput from '../TextInput';
import { IconButton } from '../../Button';
import { Menu, MenuItem } from '../../Menu';

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 0;
  bottom: -0.5rem;
`;

const SelectInput = ({
  options,
  value,
  onChange,
  label,
  labelSingular,
  multiple,
  className,
  ...props
}) => {
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
    <>
      <TextInput
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
        className={className}
      >
        <StyledIconButton
          disabled={!options}
          onClick={handleOpenMenu}
          icon="chevron-down"
          active={!!anchorEl}
        />
      </TextInput>
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
    </>
  );
};

export default SelectInput;
