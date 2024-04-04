import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import NumberInput from '.';

export default {
  title: 'Inputs/NumberInput',
  component: NumberInput,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Number Input Label',
    placeholder: 'Type something here',
    description: 'This is a description',
    status: 'Required',
    value: 10,
    step: 1,
    min: 0,
    max: 100,
    title: false,
    inline: false,
    error: false,
    errors: [
      {
        message: 'Error message.',
      },
    ],
  },
};

const StyledNumberInput = styled(NumberInput)`
  width: 33vw;
`;

export function _NumberInput(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(e) {
    console.log(e.target.value);
    updateArgs({ value: e.target.value });
  }

  return <StyledNumberInput {...args} value={value} onChange={handleChange} />;
}
