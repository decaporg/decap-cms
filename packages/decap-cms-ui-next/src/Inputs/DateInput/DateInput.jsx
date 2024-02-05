import React, { useState } from 'react';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { DatetimePicker } from 'rc-datetime-picker-dayjs';

import TextInput from '../TextInput';
import { IconButton } from '../../Button';
import { Menu } from '../../Menu';
import DatepickerStyles from './DatepickerStyles';

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 0;
  bottom: -0.5rem;
`;

const StyledMenu = styled(Menu)`
  padding: 0;
`;

const shortcuts = {
  Today: dayjs(),
  Yesterday: dayjs().subtract(1, 'days'),
  Tomorrow: dayjs().add(1, 'days'),
  Clear: '',
};

const StyledDatetimePicker = styled(DatetimePicker)`
  width: 100%;
  background-color: transparent;
`;

function DateInput({ onChange, ...props }) {
  const [date, setDate] = useState(dayjs());
  const [anchorEl, setAnchorEl] = useState(null);

  function handleOpenMenu(event) {
    // setAnchorElWidth(`${event.currentTarget.offsetWidth}px`);
    setAnchorEl(event.currentTarget);
  }

  function handleClose(value) {
    if (value && typeof value === 'string') {
      onChange(value);
    }
    setAnchorEl(null);
  }

  return (
    <>
      <DatepickerStyles />
      <TextInput
        {...props}
        readOnly
        value={date && date.format('YYYY-MM-DD HH:mm')}
        onClick={handleOpenMenu}
        focus={!!anchorEl}
        icon="calendar"
      >
        <StyledIconButton icon="calendar" active={!!anchorEl} />
      </TextInput>
      <StyledMenu
        anchorOrigin={{ x: 'right', y: 'bottom' }}
        transformOrigin={{ x: 'right', y: 'top' }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        width={'300px'}
      >
        <StyledDatetimePicker
          shortcuts={shortcuts}
          closeOnSelectDay
          moment={date}
          onChange={date => setDate(date)}
        />
      </StyledMenu>
    </>
  );
}
export default DateInput;
