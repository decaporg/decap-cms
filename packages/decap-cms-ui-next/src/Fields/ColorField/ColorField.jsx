import React, { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { HexColorPicker } from 'react-colorful';

import { Menu } from '../../Menu';
import TextField from '../TextField';
import ColorPickerStyles from './ColorPickerStyles';
import { useClickAway } from '../../hooks';

const StyledMenu = styled(Menu)`
  padding: 0;
`;

const Swatch = styled.div`
  position: absolute;
  right: ${({ inline }) => (inline ? 0 : 0.5)}rem;
  top: 1.85rem;

  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  border: 3px solid ${({ theme }) => theme.color.surface};
  background-color: ${({ color }) => color};
  box-shadow: ${({ theme }) =>
    `0 0 0 1px ${theme.color.lowEmphasis}, inset 0 0 0 1px ${theme.color.lowEmphasis}`};
  cursor: pointer;
`;

function ColorField({
  name,
  label,
  status,
  placeholder,
  description,
  alpha,
  readOnly,
  value,
  onChange,
  error,
  errors,
  ...props
}) {
  const [color, setColor] = useState(value);
  const [anchorEl, setAnchorEl] = useState(null);
  const popover = useRef(null);

  useClickAway(popover, handleClose);

  function handleOpenMenu(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose(event) {
    console.log('handleClose', event);
    // setAnchorEl(event ? event.currentTarget : null);
    setAnchorEl(null);
  }

  return (
    <>
      <ColorPickerStyles />

      <TextField
        name={name}
        label={label}
        labelTarget={name}
        status={status}
        placeholder={placeholder}
        description={description}
        onClick={readOnly ? handleOpenMenu : null}
        onChange={setColor}
        error={error}
        errors={errors}
        type={color}
        value={color}
        icon={<Swatch color={color} onClick={handleOpenMenu} />}
        readOnly={readOnly}
        {...props}
      >
        <StyledMenu
          anchorOrigin={{ x: 'right', y: 'bottom' }}
          transformOrigin={{ x: 'right', y: 'top' }}
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={handleClose}
          ref={popover}
        >
          {anchorEl && (
            <HexColorPicker
              color={color}
              alpha={alpha}
              onChange={color => {
                setColor(color);
                onChange && onChange(color);
              }}
            />
          )}
        </StyledMenu>
      </TextField>
    </>
  );
}

export default ColorField;
