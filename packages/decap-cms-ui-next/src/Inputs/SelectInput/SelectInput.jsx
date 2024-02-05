import React, { useState } from 'react';
import styled from '@emotion/styled';
import TextInput from '../TextInput';
import Field from '../../Field';
import { Tag, TagGroup } from '../../Tag';
import { Menu, MenuItem } from '../../Menu';

const SelectInput = ({
  options,
  value,
  onChange,
  label,
  labelSingular,
  multiple,
  placeholder,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElWidth, setAnchorElWidth] = useState();

  const handleOpenMenu = event => {
    setAnchorElWidth(`${event.currentTarget.offsetWidth}px`);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = newValue => {
    if (newValue) {
      onChange(multiple ? [...(value || []), newValue] : newValue);
    }
    setAnchorEl(null);
  };

  const selection = options.find(option =>
    Array.isArray(value) ? option.name === value?.[0]?.name : option.name === value?.name,
  );

  const availableOptions = multiple
    ? options.filter(option => value.every(opt => opt.name !== option.name))
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
                  key={option.name}
                  onDelete={() => onChange(value.filter(opt => opt.name !== option.name))}
                >
                  {option.label}
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
                selected={!multiple && value && value.name === option.name}
                onClick={() => handleClose(option)}
                key={option.name}
              >
                {option.label}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              No {label?.[0]?.toLowerCase() + label?.substr(1)} to select.
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );
};

export default SelectInput;
