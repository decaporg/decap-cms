import React from 'react';
import { render } from '@testing-library/react';

import GitGatewayAuthenticationPage from '../AuthenticationPage';

window.netlifyIdentity = {
  currentUser: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
};

describe('GitGatewayAuthenticationPage', () => {
  const props = {
    config: { logo_url: 'logo_url' },
    t: jest.fn(key => key),
    onLogin: jest.fn(),
    inProgress: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should render with identity error', () => {
    // obtain mock calls
    require('../AuthenticationPage');

    function TestComponent() {
      const { asFragment } = render(<GitGatewayAuthenticationPage {...props} />);

      const errorCallback = window.netlifyIdentity.on.mock.calls.find(
        call => call[0] === 'error',
      )[1];

      errorCallback(
        new Error('Failed to load settings from https://site.netlify.com/.netlify/identity'),
      );

      expect(asFragment()).toMatchSnapshot();
    }

    TestComponent();
  });

  test('should render with no identity error', () => {
    function TestComponent() {
      const { asFragment } = render(<GitGatewayAuthenticationPage {...props} />);
      expect(asFragment()).toMatchSnapshot();
    }

    TestComponent();
  });
});
