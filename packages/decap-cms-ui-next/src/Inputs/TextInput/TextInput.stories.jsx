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
  args: {
    label: 'Text Input Label',
    placeholder: 'Type something here',
    value: '',
    inline: false,
    error: false,
  },
};

export function _TextInput(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(value) {
    updateArgs({ value });
  }

  return <StyledTextInput {...args} value={value} onChange={handleChange} />;
}
