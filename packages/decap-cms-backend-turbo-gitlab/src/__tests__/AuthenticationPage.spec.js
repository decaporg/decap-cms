import { render, fireEvent, cleanup } from '@testing-library/react';

import SupabaseAuthenticationPage from '../AuthenticationPage';

function encodedMetadata(metadata) {
  return btoa(JSON.stringify(metadata));
}

describe('SupabaseAuthenticationPage', () => {
  const baseProps = {
    config: { backend: { turbo_admin_url: 'https://turbo.example.com' } },
    t: jest.fn(key => key),
    onLogin: jest.fn(),
    inProgress: false,
  };

  let popup;

  beforeEach(() => {
    jest.clearAllMocks();
    popup = { closed: false, close: jest.fn() };
    window.open = jest.fn().mockReturnValue(popup);
  });

  afterEach(() => {
    cleanup();
  });

  function postMessageEvent(data, origin = 'https://turbo.example.com') {
    window.dispatchEvent(new MessageEvent('message', { data, origin }));
  }

  function validCredentialsPayload() {
    return {
      source: 'decap-turbo-login',
      credentials: {
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_at: '1700000000',
        user_email: 'user@example.com',
        user_name: 'user',
        user_metadata: encodedMetadata({ active_site_id: 'site-123' }),
      },
    };
  }

  it('ignores messages from an origin other than the configured turbo_admin_url', () => {
    const onLogin = jest.fn();
    render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);

    postMessageEvent(validCredentialsPayload(), 'https://evil.example.com');

    expect(onLogin).not.toHaveBeenCalled();
  });

  it('ignores messages that are not from the expected source', () => {
    const onLogin = jest.fn();
    render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);

    postMessageEvent({ source: 'not-decap-turbo', credentials: {} });

    expect(onLogin).not.toHaveBeenCalled();
  });

  it('logs in and closes the popup on a valid message from the trusted origin', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);

    fireEvent.click(getByText('Login with Turbo'));
    expect(window.open).toHaveBeenCalledTimes(1);

    postMessageEvent(validCredentialsPayload());

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_at: 1700000000,
      }),
    );
    expect(popup.close).toHaveBeenCalledTimes(1);
  });

  it('does not close an already-closed popup', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);

    fireEvent.click(getByText('Login with Turbo'));
    popup.closed = true;

    postMessageEvent(validCredentialsPayload());

    expect(popup.close).not.toHaveBeenCalled();
  });

  it('shows a popup-blocked message when window.open returns null', () => {
    window.open = jest.fn().mockReturnValue(null);
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} />);

    fireEvent.click(getByText('Login with Turbo'));

    expect(getByText(/blocked the login popup/)).toBeTruthy();
  });

  it('closes the popup on unmount', () => {
    const { getByText, unmount } = render(<SupabaseAuthenticationPage {...baseProps} />);

    fireEvent.click(getByText('Login with Turbo'));
    unmount();

    expect(popup.close).toHaveBeenCalledTimes(1);
  });
});
