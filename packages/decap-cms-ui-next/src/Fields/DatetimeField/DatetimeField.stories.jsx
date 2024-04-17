import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';
import dayjs from 'dayjs';

import DatetimeField from '.';

const StyledDatetimeField = styled(DatetimeField)`
  width: 33vw;
`;

export default {
  title: 'Fields/DatetimeField',
  component: DatetimeField,
  argTypes: {
    value: {
      control: 'date',
    },
    type: {
      control: 'select',
      options: ['date', 'time', 'datetime-local'],
    },
    shortcuts: {
      control: 'object',
    },
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Datetime Field Label',
    status: 'Required',
    description: 'This is a description',
    value: new Date(),
    type: 'datetime-local',
    shortcuts: {
      Now: dayjs(),
      Clear: '',
    },
    inline: false,
    error: false,
    errors: [
      {
        message: 'Error message.',
      },
    ],
  },
};

export function _DatetimeField(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleValue(date) {
    updateArgs({ value: date });
  }

  return <StyledDatetimeField {...args} value={dayjs(value)} onChange={handleValue} />;
}
