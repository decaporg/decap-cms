import React from 'react';
import { render } from '@testing-library/react';

import NetlifyAuthenticationPage from '../NetlifyAuthenticationPage';

window.netlifyIdentity = {
  currentUser: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
};

describe('NetlifyAuthenticationPage', () => {
  const props = {
    config: { logo: { src: 'logo_url' } },
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
    require('../NetlifyAuthenticationPage');

    function TestComponent() {
      const { asFragment } = render(<NetlifyAuthenticationPage {...props} />);

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
      const { asFragment } = render(<NetlifyAuthenticationPage {...props} />);
      expect(asFragment()).toMatchSnapshot();
    }

    TestComponent();
  });
});
