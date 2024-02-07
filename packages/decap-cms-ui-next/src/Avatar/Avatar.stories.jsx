import React from 'react';

import Avatar from '.';

export default {
  title: 'Components/Avatar',
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      mapping: {
        md: null,
      },
      table: {
        defaultValue: { summary: 'md' },
      },
    },
  },
  args: {
    src: 'https://randomuser.me/api/portraits/men/94.jpg',
    size: 'md',
  },
};

export function _Avatar(args) {
  return <Avatar {...args} />;
}
