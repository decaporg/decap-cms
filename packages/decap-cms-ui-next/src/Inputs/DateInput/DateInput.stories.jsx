import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';
import dayjs from 'dayjs';

import DateInput from '.';

const StyledDateInput = styled(DateInput)`
  width: 33vw;
`;

export default {
  title: 'Inputs/DateInput',
  component: DateInput,
  argTypes: {
    value: {
      control: 'date',
    },
  },
  args: {
    label: 'Date Input Label',
    value: new Date(),
    inline: false,
    error: false,
  },
};

export function _DateInput(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleValue(value) {
    updateArgs({ value });
  }

  return <StyledDateInput {...args} value={dayjs(value)} onChange={handleValue} />;
}
