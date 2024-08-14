import React, { useState } from 'react';

import TextField from '../TextField';
import Field from '../../Field';
import { Badge, BadgeGroup } from '../../Badge';
import { Menu, MenuItem } from '../../Menu';

function SelectField({
  options,
  value,
  onChange,
  label,
  labelSingular,
  multiple,
  placeholder,
  ...props
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElWidth, setAnchorElWidth] = useState();

  function handleOpenMenu(event) {
    setAnchorElWidth(`${event.currentTarget.offsetWidth}px`);
    setAnchorEl(event.currentTarget);
  }

  function handleClose(newValue) {
    if (!newValue) {
      setAnchorEl(null);
      return;
    }

    if (multiple) {
      const updatedValue =
        value && value.includes(newValue)
          ? value.filter(opt => opt !== newValue)
          : value
          ? [...value, newValue]
          : [newValue];

      onChange(updatedValue);
    } else {
      onChange(value === newValue ? null : newValue);
    }

    setAnchorEl(null);
  }

  const selection = options.find(option => option.value === value);

  const availableOptions =
    multiple && value
      ? options.filter(option => value.every(opt => opt.value !== option.value))
      : options;

  return (
    <>
      {multiple ? (
        <Field
          {...props}
          onClick={handleOpenMenu}
          label={label}
          focus={!!anchorEl}
          icon="chevron-down"
        >
          {value && value.length ? (
            <BadgeGroup>
              {value.map(option => (
                <Badge
                  key={option.value}
                  onDelete={() => onChange(value.filter(opt => opt !== option))}
                >
                  {options.find(opt => opt.value === option).label}
                </Badge>
              ))}
            </BadgeGroup>
          ) : (
            <span>{placeholder || `Select ${label}...`}</span>
          )}
        </Field>
      ) : (
        <TextField
          {...props}
          readOnly
          label={labelSingular || label}
          onClick={handleOpenMenu}
          focus={!!anchorEl}
          value={options && selection?.label}
          placeholder={placeholder || `Select a ${labelSingular || label}...`}
          icon="chevron-down"
        />
      )}

      {options && (
        <Menu
          anchorOrigin={{ x: 'center', y: 'bottom' }}
          transformOrigin={{ x: 'center', y: 'top' }}
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => handleClose()}
          width={anchorElWidth}
        >
          {availableOptions.length ? (
            availableOptions.map(option => (
              <MenuItem
                selected={multiple ? value && value.includes(option.value) : value === option.value}
                onClick={() => handleClose(option.value)}
                key={option.value}
              >
                {option.label}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              No {label?.[0]?.toLowerCase() + label?.slice(1)} to select.
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );
}

export default SelectField;
