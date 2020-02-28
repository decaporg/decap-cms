import React, { useState } from 'react';
import styled from '@emotion/styled';
import moment from 'moment';
import { DatetimePicker } from 'rc-datetime-picker';
import TextWidget from './TextWidget';
import IconButton from '../IconButton';
import { Menu } from '../Menu';

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: 0;
  bottom: -0.5rem;
`;
const StyledMenu = styled(Menu)`
  padding: 0;
`;

const shortcuts = {
  Today: moment(),
  Yesterday: moment().subtract(1, 'days'),
  Tomorrow: moment().add(1, 'days'),
  Clear: '',
};
const StyledDatetimePicker = styled(DatetimePicker)`
  width: 100%;
  background-color: transparent;
`;

const DateWidget = ({ value, onChange, ...props }) => {
  const [date, setDate] = useState(moment());
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

  return (
    <div>
      <TextWidget
        {...props}
        readOnly
        value={date && date.format('YYYY-MM-DD HH:mm')}
        onClick={handleOpenMenu}
        focused={!!anchorEl}
      >
        <StyledIconButton icon="calendar" active={!!anchorEl} />
      </TextWidget>
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
    </div>
  );
};
export default DateWidget;
