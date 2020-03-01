import React from 'react';
import styled from '@emotion/styled';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';

import TextWidget from '.';

const StyledTextWidget = styled(TextWidget)`
  width: 100%;
`;

export default {
  title: 'Widgets/TextWidget',
  decorators: [withKnobs],
};

export const _TextWidget = () => {
  return <StyledTextWidget label="Text Widget Label" placeholder="Type something here" />;
};

_TextWidget.story = {
  name: 'TextWidget',
};
