import React from 'react';

import Icon, { iconComponents } from './Icon';

export default {
  title: 'Components/Icon',
  component: Icon,
  argTypes: {
    name: {
      control: 'select',
      options: {
        default: null,
        ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
      },
      table: {
        defaultValue: { summary: 'null' },
      },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      mapping: {
        md: null,
      },
      table: {
        defaultValue: { summary: 'md' },
      },
    },
  },
  args: {
    name: null,
    size: 'md',
  },
};

export function _Icon(args) {
  return <Icon {...args} />;
}
