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
  args: {
    label: 'Boolean Input Label',
    value: false,
    inline: false,
    error: false,
  },
};

export function _BooleanInput(args) {
  const [{ value }, updateArgs] = useArgs();

  function toggleValue() {
    updateArgs({ value: !value });
  }

  return <StyledBooleanInput {...args} value={value} onChange={toggleValue} />;
}
