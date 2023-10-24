import React from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import BooleanInput from '.';

const StyledBooleanInput = styled(BooleanInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/BooleanInput',
  decorators: [withKnobs],
};

export const _BooleanInput = () => {
  return (
    <StyledBooleanInput
      label="Boolean Input Label"
      value={boolean('value', false)}
      inline={boolean('inline', false)}
      error={boolean('error', false)}
    />
  );
};

_BooleanInput.story = {
  name: 'BooleanInput',
};
