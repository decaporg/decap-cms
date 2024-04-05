import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { DatetimePicker } from 'rc-datetime-picker-dayjs';

import TextInput from '../TextInput';
import { Menu } from '../../Menu';
import DatepickerStyles from './DatepickerStyles';

const StyledMenu = styled(Menu)`
  padding: 0;
`;

const StyledDatetimePicker = styled(DatetimePicker)`
  width: 100%;
  background-color: transparent;
`;

function DateInput({ onChange, value = dayjs(), type, format, shortcuts, ...props }) {
  const [date, setDate] = useState(value);
  const [inputFormat, setInputFormat] = useState('YYYY-MM-DDTHH:mm:ssZ');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (type === 'date') {
      setInputFormat('YYYY-MM-DD');
    } else if (type === 'time') {
      setInputFormat('HH:mm');
    } else {
      setInputFormat('YYYY-MM-DDTHH:mm');
    }
  }, [type]);

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
      <DatepickerStyles shortcuts={shortcuts} />

      <TextInput
        {...props}
        readOnly
        value={date && date.format(format || inputFormat)}
        type={type}
        onClick={handleOpenMenu}
        focus={!!anchorEl}
        icon="calendar"
      />

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
          showCalendarPicker={type === 'date' || type === 'datetime-local'}
          showTimePicker={type === 'time' || type === 'datetime-local'}
          closeOnSelectDay
          dayjs={date}
          onChange={date => {
            setDate(date);
            onChange(date);
          }}
        />
      </StyledMenu>
    </>
  );
}
export default DateInput;
