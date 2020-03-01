import React from 'react';
import styled from '@emotion/styled';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';

import Avatar from '.';

export default {
  title: 'Components/Avatar',
  decorators: [withKnobs],
};

export const _Avatar = () => {
  return (
    <Avatar
      size={select('size', { md: null, lg: 'lg' }, null)}
      src={text('src', 'https://randomuser.me/api/portraits/men/94.jpg')}
    />
  );
};
