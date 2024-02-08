import React from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import ToggleSwitch from '.';

export default {
  title: 'Components/ToggleSwitch',
  component: ToggleSwitch,
  argTypes: {
    checked: {
      control: 'boolean',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
  args: {
    checked: false,
  },
};

export function _ToggleSwitch(args) {
  const [{ checked }, updateArgs] = useArgs();

  function toggleChecked() {
    updateArgs({ checked: !checked });
  }

  return (
    <ToggleSwitch
      {...args}
      onChange={event => {
        action('onChange')(event ? 'checked' : 'unchecked');
        toggleChecked();
      }}
    />
  );
}
