import React from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import AuthenticationPage from './AuthenticationPage';

export default {
  title: 'Pages/AuthenticationPage',
  component: AuthenticationPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onLogin: action('onLogin'),
    inProgress: false,
  },
};

export function _AuthenticationPage(args) {
  return (
    <AuthenticationPage
      {...args}
      onLogin={() => false}
      config={{ backend: {} }}
      t={() => 'Login'}
    />
  );
}
