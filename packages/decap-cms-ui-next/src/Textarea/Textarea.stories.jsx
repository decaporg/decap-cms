import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import Textarea from '.';

export default {
  title: 'Components/Textarea',
  component: Textarea,
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
    label: 'Textarea Label',
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

const StyledTextarea = styled(Textarea)`
  width: 33vw;
`;

export function _Textarea(args) {
  const [{ value }, updateArgs] = useArgs();

  function handleChange(e) {
    updateArgs({ value: e.target.value });
  }

  return <StyledTextarea {...args} value={value} onChange={handleChange} />;
}
