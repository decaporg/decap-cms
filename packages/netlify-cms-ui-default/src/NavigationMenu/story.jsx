import React from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import NavigationMenu from '.';

export default {
  title: 'Components/NavigationMenu',
  decorators: [withKnobs],
};

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.color.background};
`;

export const _NavigationMenu = () => {
  return (
    <Wrap>
      <NavigationMenu />
    </Wrap>
  );
};

_NavigationMenu.story = {
  name: 'NavigationMenu',
};
