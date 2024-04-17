import React from 'react';
import styled from '@emotion/styled';

import ColorField from '.';

export default {
  title: 'Fields/ColorField',
  component: ColorField,
  argTypes: {
    errors: {
      control: 'object',
      if: {
        arg: 'error',
      },
    },
  },
  args: {
    label: 'Color Field Label',
    status: 'Required',
    placeholder: 'Type color here',
    description: 'This is a description',
    value: '#000000',
    readOnly: true,
    alpha: false,
    inline: false,
    error: false,
    errors: [
      {
        message: 'Error message.',
      },
    ],
  },
};

const StyledColorField = styled(ColorField)`
  width: 33vw;
`;

export function _ColorField(args) {
  return <StyledColorField {...args} />;
}
