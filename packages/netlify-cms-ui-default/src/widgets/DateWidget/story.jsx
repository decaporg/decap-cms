import React from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import DateWidget from '.';

const StyledDateWidget = styled(DateWidget)`
  width: 100%;
`;

export default {
  title: 'Widgets/DateWidget',
  decorators: [withKnobs],
};

export const _DateWidget = () => {
  return <StyledDateWidget label="Date Widget Label" />;
};

_DateWidget.story = {
  name: 'DateWidget',
};
