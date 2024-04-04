import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import TextInput from '.';

const StyledTextInput = styled(TextInput)`
  width: 33vw;
`;

export default {
  title: 'Inputs/TextInput',
  component: TextInput,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Text Input Label',
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

export function _TextInput(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(e) {
    updateArgs({ value: e.target.value });
  }

  return <StyledTextInput {...args} value={value} onChange={handleChange} />;
}
