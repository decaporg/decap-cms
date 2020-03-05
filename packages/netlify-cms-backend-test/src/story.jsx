import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';

import AuthenticationPage from './AuthenticationPage';

export default {
  title: 'Pages/AuthenticationPage',
  decorators: [withKnobs],
};

export const _AuthenticationPage = () => {
  return (
    <AuthenticationPage
      onLogin={() => false}
      inProgress={false}
      config={{ backend: {} }}
      t={() => false}
    />
  );
};

_AuthenticationPage.story = {
  name: 'AvatarButton',
};
