import React, { useState } from 'react';
import styled from '@emotion/styled';
import DateTimePicker from 'react-datetime-picker';
import moment from 'moment';

import TextInput from '../TextInput';
import { Menu } from '../../Menu';
import DatepickerStyles from './DatepickerStyles';

const StyledMenu = styled(Menu)`
  padding: 0;
`;

const StyledDatetimePicker = styled(DateTimePicker)`
  width: 100%;
  background-color: transparent;
`;

function DateInput ({ onChange, ...props }) {
  const [date, setDate] = useState(new Date());
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
        value={date && moment(date).format('YYYY-MM-DD HH:mm')}
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
          value={date}
          onChange={date => setDate(date)}
        />
      </StyledMenu>
    </>
  );
};
export default DateInput;
