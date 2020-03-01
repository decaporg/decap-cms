import React from 'react';
import styled from '@emotion/styled';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';

import ToggleSwitch from '.';

export default {
  title: 'Components/ToggleSwitch',
  decorators: [withKnobs],
};

export const _ToggleSwitch = () => {
  return <ToggleSwitch checked={boolean('checked', false)} />;
};

_ToggleSwitch.story = {
  name: 'ToggleSwitch',
};
