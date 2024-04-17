import React from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import Toggle from '.';
import { iconComponents } from '../Icon';

export default {
  title: 'Components/Toggle',
  component: Toggle,
  argTypes: {
    pressed: {
      control: 'boolean',
      table: {
        defaultValue: { summary: false },
      },
    },
    disabled: {
      control: 'boolean',
      table: {
        defaultValue: { summary: false },
      },
    },
    icon: {
      control: 'select',
      options: {
        default: null,
        ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
      },
      table: {
        defaultValue: { summary: 'null' },
      },
    },
  },
  args: {
    icon: 'bold',
    hasMenu: false,
    pressed: false,
    onPressedChange: action('onPressedChange'),
    disabled: false,
  },
};

export function _Toggle(args) {
  const [{ pressed }, updateArgs] = useArgs();

  function togglePressed() {
    updateArgs({ pressed: !pressed });
  }

  return <Toggle {...args} onPressedChange={togglePressed} />;
}
