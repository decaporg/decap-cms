import React from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import TextInput from '.';

const StyledTextInput = styled(TextInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/TextInput',
  decorators: [withKnobs],
};

export const _TextInput = () => {
  return (
    <StyledTextInput
      label="Text Input Label"
      placeholder="Type something here"
      inline={boolean('inline', false)}
      error={boolean('error', false)}
    />
  );
};

_TextInput.story = {
  name: 'TextInput',
};
