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
    size: 'md',
  },
};

export function AvatarWithImage(args) {
  return <Avatar {...args} />;
}

AvatarWithImage.argTypes = {
  src: {
    control: 'text',
  },
};

AvatarWithImage.args = {
  src: 'https://randomuser.me/api/portraits/men/94.jpg',
};

export function AvatarWithFallback(args) {
  return <Avatar {...args} />;
}

AvatarWithFallback.argTypes = {
  fallback: {
    control: 'text',
  },
};

AvatarWithFallback.args = {
  fallback: 'JD',
  size: 'md',
};
