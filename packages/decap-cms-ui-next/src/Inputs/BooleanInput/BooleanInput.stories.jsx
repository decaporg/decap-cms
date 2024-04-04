import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import BooleanInput from '.';

const StyledBooleanInput = styled(BooleanInput)`
  width: 33vw;
`;

export default {
  title: 'Inputs/BooleanInput',
  component: BooleanInput,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Boolean Input Label',
    description: 'This is a description',
    status: 'Required',
    value: false,
    inline: false,
    error: false,
    errors: [
      {
        message: 'Error message.',
      },
    ],
  },
};

export function _BooleanInput(args) {
  const [{ value }, updateArgs] = useArgs();

  function toggleValue() {
    updateArgs({ value: !value });
  }

  return <StyledBooleanInput {...args} value={value} onChange={toggleValue} />;
}
