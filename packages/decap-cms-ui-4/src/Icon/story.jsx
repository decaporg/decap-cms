import React from 'react';
import styled from '@emotion/styled';
import { withKnobs, select } from '@storybook/addon-knobs';

import Icon, { iconComponents } from './Icon';

const StyledIcon = styled(Icon)`
  color: ${({ theme }) => theme.color.highEmphasis};
`;

export default {
  title: 'Components/Icon',
  decorators: [withKnobs],
};

export const _Icon = () => {
  return (
    <StyledIcon
      size={select('size', { xs: 'xs', sm: 'sm', md: null, lg: 'lg', xl: 'xl' }, null)}
      name={select(
        'name',
        {
          default: null,
          ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
        },
        null,
      )}
    />
  );
};
