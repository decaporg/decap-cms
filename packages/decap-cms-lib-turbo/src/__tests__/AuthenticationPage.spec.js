import { TextDecoder, TextEncoder } from 'util';
import { render, fireEvent, cleanup } from '@testing-library/react';

import SupabaseAuthenticationPage from '../AuthenticationPage';

// Every browser has these; jest 27's jsdom does not.
Object.assign(global, { TextDecoder, TextEncoder });

// As Turbo encodes it: base64 of the UTF-8 bytes, not of the UTF-16 string.
function encodedMetadata(metadata) {
  const bytes = new TextEncoder().encode(JSON.stringify(metadata));
  return btoa(String.fromCharCode(...bytes));
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

  // `source` is the popup unless a test says otherwise. Set after
  // construction because jsdom only accepts a real window in the init dict.
  function postMessageEvent(data, origin = 'https://turbo.example.com', source = popup) {
    const event = new MessageEvent('message', { data, origin });
    Object.defineProperty(event, 'source', { value: source });
    window.dispatchEvent(event);
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

  it('ignores a trusted-origin message from a window other than the popup it opened', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);
    fireEvent.click(getByText('Login with Turbo'));

    postMessageEvent(validCredentialsPayload(), 'https://turbo.example.com', {});

    expect(onLogin).not.toHaveBeenCalled();
    expect(popup.close).not.toHaveBeenCalled();
  });

  it('names the site in the login URL when turbo_site_id is set', () => {
    const config = {
      backend: { turbo_admin_url: 'https://turbo.example.com/', turbo_site_id: 'site 1&x' },
    };
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} config={config} />);

    fireEvent.click(getByText('Login with Turbo'));

    const url = new URL(window.open.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://turbo.example.com/auth/decap-redirect');
    expect(url.searchParams.get('site_id')).toBe('site 1&x');
    expect(url.searchParams.get('redirect_to')).toBe('http://localhost:8080/?popup=1');
  });

  it('leaves site_id out of the login URL when turbo_site_id is not set', () => {
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} />);

    fireEvent.click(getByText('Login with Turbo'));

    expect(new URL(window.open.mock.calls[0][0]).searchParams.has('site_id')).toBe(false);
  });

  it('decodes non-ASCII user metadata', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);
    fireEvent.click(getByText('Login with Turbo'));

    const payload = validCredentialsPayload();
    postMessageEvent({
      ...payload,
      credentials: {
        ...payload.credentials,
        user_metadata: encodedMetadata({ name: 'Žiga Ćosić' }),
      },
    });

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ user_metadata: { name: 'Žiga Ćosić' } }),
    );
  });

  it('does not pass the access token on as a provider token', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);
    fireEvent.click(getByText('Login with Turbo'));

    postMessageEvent(validCredentialsPayload());

    expect(onLogin.mock.calls[0][0]).not.toHaveProperty('provider_token');
  });

  it('passes on whether Turbo minted the session for this CMS alone', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);
    fireEvent.click(getByText('Login with Turbo'));

    const payload = validCredentialsPayload();
    postMessageEvent({
      ...payload,
      credentials: { ...payload.credentials, dedicated_session: '1' },
    });

    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ dedicated_session: true }));
  });

  it('treats a session from a Turbo that does not say as shared', () => {
    const onLogin = jest.fn();
    const { getByText } = render(<SupabaseAuthenticationPage {...baseProps} onLogin={onLogin} />);
    fireEvent.click(getByText('Login with Turbo'));

    postMessageEvent(validCredentialsPayload());

    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ dedicated_session: false }));
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
