import React from 'react';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, select, text } from '@storybook/addon-knobs';

import AuthenticationPage from './AuthenticationPage';

export default {
  title: 'Pages/AuthenticationPage',
  decorators: [withKnobs],
};

export const _AuthenticationPage = () => {
  return (
    <AuthenticationPage onLogin={() => false} inProgress={false} config={{}} t={() => false} />
  );
};

_AuthenticationPage.story = {
  name: 'AvatarButton',
};
