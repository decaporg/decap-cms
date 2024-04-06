import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import TextField from '.';

const StyledTextField = styled(TextField)`
  width: 33vw;
`;

export default {
  title: 'Fields/TextField',
  component: TextField,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Text Field Label',
    placeholder: 'Type something here',
    description: 'This is a description',
    status: 'Required',
    value: '',
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

export function _TextField(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(e) {
    updateArgs({ value: e.target.value });
  }

  return <StyledTextField {...args} value={value} onChange={handleChange} />;
}
