import React from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import DateInput from '.';

const StyledDateInput = styled(DateInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/DateInput',
  decorators: [withKnobs],
};

export const _DateInput = () => {
  return (
    <StyledDateInput
      label="Date Input Label"
      inline={boolean('inline', false)}
      error={boolean('error', false)}
    />
  );
};

_DateInput.story = {
  name: 'DateInput',
};
