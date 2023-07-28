import React from 'react';
import { render } from '@testing-library/react';

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
    const { default: GitGatewayAuthenticationPage } = require('../AuthenticationPage');
    const { asFragment } = render(<GitGatewayAuthenticationPage {...props} />);

    const errorCallback = window.netlifyIdentity.on.mock.calls.find(call => call[0] === 'error')[1];

    errorCallback(
      new Error('Failed to load settings from https://site.netlify.com/.netlify/identity'),
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render with no identity error', () => {
    const { default: GitGatewayAuthenticationPage } = require('../AuthenticationPage');
    const { asFragment } = render(<GitGatewayAuthenticationPage {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
