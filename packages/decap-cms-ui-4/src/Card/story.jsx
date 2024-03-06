import React from 'react';
import styled from '@emotion/styled';
import { withKnobs, select } from '@storybook/addon-knobs';

import Card from '.';

const StyledCard = styled(Card)`
  width: 20rem;
  height: 20rem;
`;

export default {
  title: 'Components/Card',
  decorators: [withKnobs],
};

export const _Card = () => {
  return (
    <StyledCard
      elevation={select('elevation', { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg' }, 'xs')}
      direction={select(
        'direction',
        { up: 'up', right: 'right', down: 'down', left: 'left' },
        'down',
      )}
      rounded={select('rounded', { null: null, sm: 'sm', md: 'md', lg: 'lg' }, null)}
    />
  );
};

_Card.story = {
  name: 'Card',
};
