import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import BooleanField from '.';

const StyledBooleanField = styled(BooleanField)`
  width: 33vw;
`;

export default {
  title: 'Fields/BooleanField',
  component: BooleanField,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Boolean Field Label',
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

export function _BooleanField(args) {
  const [{ value }, updateArgs] = useArgs();

  function toggleValue() {
    updateArgs({ value: !value });
  }

  return <StyledBooleanField {...args} value={value} onChange={toggleValue} />;
}
