import React from 'react';
import { withKnobs, boolean } from '@storybook/addon-knobs';

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
