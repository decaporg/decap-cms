import React from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import Switch from '.';

export default {
  title: 'Components/Switch',
  component: Switch,
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

export function _Switch(args) {
  const [{ checked }, updateArgs] = useArgs();

  function toggleChecked() {
    updateArgs({ checked: !checked });
  }

  return (
    <Switch
      {...args}
      onCheckedChange={event => {
        action('onChange')(event ? 'checked' : 'unchecked');
        toggleChecked();
      }}
    />
  );
}
