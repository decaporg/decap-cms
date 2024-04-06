import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import TextareaField from '.';

export default {
  title: 'Fields/TextareaField',
  component: TextareaField,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    name: 'textarea',
    label: 'Textarea Field Label',
    placeholder: 'Type something here',
    description: 'This is a description',
    status: 'Required',
    value: '',
    minRows: 5,
    inline: false,
    error: false,
    errors: [
      {
        message: 'Error message.',
      },
    ],
  },
};

const StyledTextareaField = styled(TextareaField)`
  width: 33vw;
`;

export function _TextareaField(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(e) {
    updateArgs({ value: e.target.value });
  }

  return <StyledTextareaField {...args} value={value} onChange={handleChange} />;
}
