import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import NumberField from '.';

export default {
  title: 'Fields/NumberField',
  component: NumberField,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Number Field Label',
    placeholder: 'Type something here',
    description: 'This is a description',
    status: 'Required',
    value: 10,
    step: 1,
    min: 0,
    max: 100,
    inline: false,
    error: false,
    errors: [
      {
        message: 'Error message.',
      },
    ],
  },
};

const StyledNumberField = styled(NumberField)`
  width: 33vw;
`;

export function _NumberField(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(e) {
    updateArgs({ value: e.target.value });
  }

  return <StyledNumberField {...args} value={value} onChange={handleChange} />;
}
