import React, { useState } from 'react';

import TextInput from '../TextInput';
import Field from '../../Field';
import { Tag, TagGroup } from '../../Tag';
import { Menu, MenuItem } from '../../Menu';

function SelectInput({
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
    if (newValue) {
      onChange(multiple ? [...(value || []), newValue] : newValue);
    }
    setAnchorEl(null);
  }

  const selection = options.find(option => option.value === value);

  const availableOptions = multiple
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
          {value.length ? (
            <TagGroup>
              {value.map(option => (
                <Tag
                  key={option.value}
                  onDelete={() => onChange(value.filter(opt => opt !== option))}
                >
                  {options.find(opt => opt.value === option).label}
                </Tag>
              ))}
            </TagGroup>
          ) : (
            <span>{placeholder || `Select ${label}...`}</span>
          )}
        </Field>
      ) : (
        <TextInput
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
                selected={!multiple && value && value.name === option.value}
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

export default SelectInput;
