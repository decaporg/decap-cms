import React from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import AuthenticationPage from './AuthenticationPage';

const Wrap = styled.div`
  width: 100%;
`;

export default {
  title: 'Pages/AuthenticationPage',
  decorators: [withKnobs],
};

export const _AuthenticationPage = () => {
  return (
    <Wrap>
      <AuthenticationPage
        onLogin={() => false}
        inProgress={false}
        config={{ backend: {} }}
        t={() => 'Sign In'}
      />
    </Wrap>
  );
};

_AuthenticationPage.story = {
  name: 'AuthenticationPage',
};
