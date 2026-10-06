import { afterEach, describe, expect, it, vi } from 'vitest';

import Authenticator, { NetlifyError, type NetlifyErrorPayload } from '@/lib/auth/netlify-auth';

describe('NetlifyError', () => {
  it('returns the message when the payload has one', () => {
    const err = new NetlifyError({ message: 'something went wrong' });
    expect(err.toString()).toBe('something went wrong');
  });

  it('returns an empty string when the payload has no message', () => {
    const err = new NetlifyError({});
    expect(err.toString()).toBe('');
  });

  it('returns an empty string when the payload itself is undefined', () => {
    const err = new NetlifyError(undefined as unknown as NetlifyErrorPayload);
    expect(err.toString()).toBe('');
  });
});

describe('Authenticator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trims a trailing slash from base_url and slashes from auth_endpoint', () => {
    const authenticator = new Authenticator({
      base_url: 'https://api.netlify.com/',
      auth_endpoint: '/auth/',
    });

    expect(authenticator.base_url).toBe('https://api.netlify.com');
    expect(authenticator.auth_endpoint).toBe('auth');
  });

  it('defaults base_url and auth_endpoint when omitted', () => {
    const authenticator = new Authenticator();

    expect(authenticator.base_url).toBe('https://api.netlify.com');
    expect(authenticator.auth_endpoint).toBe('auth');
  });

  it('opens a popup sized for the github provider and builds the auth URL from PROVIDERS/site config', () => {
    const authenticator = new Authenticator({ site_id: 'my-site' });

    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(1600);
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1000);
    const focus = vi.fn();
    const windowOpen = vi.spyOn(window, 'open').mockReturnValue({ focus } as unknown as Window);

    authenticator.authenticate({ provider: 'github', scope: 'repo' }, vi.fn());

    // github: { width: 960, height: 600 } from PROVIDERS
    const expectedLeft = 1600 / 2 - 960 / 2;
    const expectedTop = 1000 / 2 - 600 / 2;

    expect(windowOpen).toHaveBeenCalledWith(
      'https://api.netlify.com/auth?provider=github&site_id=my-site&scope=repo',
      'Netlify Authorization',
      `width=960, height=600, top=${expectedTop}, left=${expectedLeft}`,
    );
    expect(focus).toHaveBeenCalled();
  });

  it('falls back to the github popup size for an unknown provider', () => {
    const authenticator = new Authenticator({ site_id: 'my-site' });

    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(1600);
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1000);
    const focus = vi.fn();
    const windowOpen = vi.spyOn(window, 'open').mockReturnValue({ focus } as unknown as Window);

    authenticator.authenticate({ provider: 'unknown-provider' }, vi.fn());

    expect(windowOpen).toHaveBeenCalledWith(
      expect.stringContaining('provider=unknown-provider'),
      'Netlify Authorization',
      expect.stringMatching(/^width=960, height=600, /),
    );
  });

  it('appends login, beta_invite and invite_code params to the auth URL when provided', () => {
    const authenticator = new Authenticator({ site_id: 'my-site' });

    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(1600);
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1000);
    const windowOpen = vi.spyOn(window, 'open').mockReturnValue(
      { focus: vi.fn() } as unknown as Window,
    );

    authenticator.authenticate(
      {
        provider: 'github',
        login: true,
        beta_invite: 'beta-code',
        invite_code: 'invite-code',
      },
      vi.fn(),
    );

    expect(windowOpen).toHaveBeenCalledWith(
      'https://api.netlify.com/auth?provider=github&site_id=my-site&login=true&beta_invite=beta-code&invite_code=invite-code',
      'Netlify Authorization',
      expect.any(String),
    );
  });

  it('reports an error and never opens a popup when no provider is given', () => {
    const authenticator = new Authenticator({ site_id: 'my-site' });
    const windowOpen = vi.spyOn(window, 'open');
    const cb = vi.fn();

    authenticator.authenticate({ provider: '' }, cb);

    expect(windowOpen).not.toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(expect.any(NetlifyError));
    expect((cb.mock.calls[0][0] as NetlifyError).toString()).toBe(
      'You must specify a provider when calling netlify.authenticate',
    );
  });

  it('sends the refresh token in the request body, never the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ token: 'new-access-token', refresh_token: 'new-refresh-token' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const authenticator = new Authenticator({
      base_url: 'https://api.example.com',
      site_id: 'cms.example.com',
    });
    // Characters that would smuggle extra query params if interpolated raw.
    const refreshToken = 'old refresh&token=secret';

    await authenticator.refresh({ provider: 'bitbucket', refresh_token: refreshToken });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/auth/refresh?provider=bitbucket&site_id=cms.example.com',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ refresh_token: refreshToken }).toString(),
      },
    );
    vi.unstubAllGlobals();
  });
});
