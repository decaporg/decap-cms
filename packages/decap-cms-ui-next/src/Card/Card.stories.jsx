import React from 'react';
import styled from '@emotion/styled';

import Card from '.';

const StyledCard = styled(Card)`
  width: 20rem;
  height: 20rem;
`;

export default {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    elevation: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'md', 'lg'],
      mapping: {
        default: null,
      },
    },
    direction: {
      control: 'select',
      options: ['up', 'down', 'left', 'right'],
      table: {
        defaultValue: { summary: 'down' },
      },
    },
    rounded: {
      control: 'select',
      options: ['null', 'sm', 'md', 'lg'],
      mapping: {
        null: null,
      },
      table: {
        defaultValue: { summary: 'lg' },
      },
    },
  },
  args: {
    elevation: 'md',
    direction: 'down',
    rounded: 'null',
  },
};

export function _Card(args) {
  return <StyledCard {...args} />;
}
