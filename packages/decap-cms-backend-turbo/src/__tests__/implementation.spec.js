import DecapTurboBackend from '../implementation';

describe('turbo backend supabase session refresh', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not logout on non-terminal refresh failure in currentUser', async () => {
    const backend = new DecapTurboBackend(config);
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;

    const refreshError = new Error('network down');
    refreshError.isTerminal = false;

    backend.getRefreshedAccessToken = jest.fn().mockRejectedValue(refreshError);
    backend.logout = jest.fn().mockResolvedValue(undefined);

    const user = await backend.currentUser({ token: 'token' });

    expect(user.login).toBe('owner');
    expect(backend.logout).not.toHaveBeenCalled();
  });

  it('logs out on terminal refresh failure in currentUser', async () => {
    const backend = new DecapTurboBackend(config);
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;

    const refreshError = new Error('invalid refresh token');
    refreshError.isTerminal = true;

    backend.getRefreshedAccessToken = jest.fn().mockRejectedValue(refreshError);
    backend.logout = jest.fn().mockResolvedValue(undefined);

    await expect(backend.currentUser({ token: 'token' })).rejects.toThrow(
      'Session expired. Please log in again.',
    );
    expect(backend.logout).toHaveBeenCalledTimes(1);
  });

  it('retries refresh for transient failures and updates credentials', async () => {
    const updateUserCredentials = jest.fn();
    const backend = new DecapTurboBackend(config, { updateUserCredentials });
    backend.supabaseRefreshToken = 'refresh-token';
    backend.delay = jest.fn().mockResolvedValue(undefined);

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }),
      });

    await expect(backend.getRefreshedAccessToken()).resolves.toBe('new-access-token');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(updateUserCredentials).toHaveBeenCalledTimes(1);
    expect(backend.supabaseAccessToken).toBe('new-access-token');
    expect(backend.supabaseRefreshToken).toBe('new-refresh-token');
  });

  it('marks invalid_grant as terminal and avoids retries', async () => {
    const backend = new DecapTurboBackend(config);
    backend.supabaseRefreshToken = 'refresh-token';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    await expect(backend.getRefreshedAccessToken()).rejects.toMatchObject({ isTerminal: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('scopes gh proxy requests with auth header, x-site-id, and site_id query param', async () => {
    const backend = new DecapTurboBackend({
      ...config,
      backend: {
        ...config.backend,
        api_root: 'https://supabase.example/functions/v1/gh',
        turbo_site_id: 'site-123',
      },
    });
    backend.supabaseAccessToken = 'access-123';

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await backend.ghFetch('https://supabase.example/functions/v1/gh/repos/owner/repo');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://supabase.example/functions/v1/gh/repos/owner/repo?site_id=site-123');
    expect(init.headers.Authorization).toBe('Bearer access-123');
    expect(init.headers['x-site-id']).toBe('site-123');
  });

  it('throws on a non-2xx ghFetch response instead of resolving', async () => {
    const backend = new DecapTurboBackend(config);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('{"message":"Not Found"}'),
    });

    await expect(backend.ghFetch('https://api.example/repos/owner/repo')).rejects.toMatchObject({
      status: 404,
    });
  });

  describe('pollUntilForkExists', () => {
    it('keeps polling while the fork 404s, then resolves once it exists', async () => {
      const backend = new DecapTurboBackend(config);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve('') })
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('') });

      await backend.pollUntilForkExists({ repo: 'owner/repo-fork', token: 'token' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('propagates a non-404 failure instead of retrying forever', async () => {
      const backend = new DecapTurboBackend(config);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(''),
      });

      await expect(
        backend.pollUntilForkExists({ repo: 'owner/repo-fork', token: 'token' }),
      ).rejects.toMatchObject({ status: 500 });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchTurboPermissions', () => {
    it('returns undefined when there is no active session', async () => {
      const backend = new DecapTurboBackend(config);
      global.fetch = jest.fn();

      const result = await backend.fetchTurboPermissions();

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches and returns permissions scoped to the current site', async () => {
      const backend = new DecapTurboBackend({
        ...config,
        backend: { ...config.backend, turbo_site_id: 'site-123' },
      });
      backend.supabaseAccessToken = 'access-123';

      const permissions = { collections: { posts: 'view', drafts: 'none' } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(permissions),
      });

      const result = await backend.fetchTurboPermissions();

      expect(result).toEqual(permissions);
      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toContain('site_id=site-123');
      expect(init.headers.Authorization).toBe('Bearer access-123');
    });

    it('returns undefined and warns when the permissions endpoint fails', async () => {
      const backend = new DecapTurboBackend({
        ...config,
        backend: { ...config.backend, turbo_site_id: 'site-123' },
      });
      backend.supabaseAccessToken = 'access-123';

      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await backend.fetchTurboPermissions();

      expect(result).toBeUndefined();
    });
  });
});

describe('turbo backend preloadConfig', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('returns the config unchanged when fully manually configured', async () => {
    const config = {
      backend: { supabase_app_id: 'app-id', supabase_anon_key: 'anon-key' },
    };

    const actual = await DecapTurboBackend.preloadConfig(config);

    expect(actual).toBe(config);
  });

  it('throws when supabase_app_id is set without supabase_anon_key', async () => {
    const config = { backend: { supabase_app_id: 'app-id' } };

    await expect(DecapTurboBackend.preloadConfig(config)).rejects.toThrow(
      /supabase_app_id.*without.*supabase_anon_key/,
    );
  });

  it('returns the config unchanged when nothing is configured at all', async () => {
    const config = { backend: {} };

    const actual = await DecapTurboBackend.preloadConfig(config);

    expect(actual).toBe(config);
  });

  it('fetches and merges control-plane defaults when only turbo_site_id is set', async () => {
    const config = { backend: { turbo_site_id: 'site-123', repo: 'owner/repo' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    });

    const actual = await DecapTurboBackend.preloadConfig(config);

    expect(actual.backend).toEqual({
      supabase_app_id: 'resolved-app-id',
      supabase_anon_key: 'resolved-key',
      turbo_site_id: 'site-123',
      repo: 'owner/repo',
    });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('site_id=site-123');
  });

  it('throws when the control-plane config endpoint fails', async () => {
    const config = { backend: { turbo_site_id: 'site-123' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'site not found' }),
    });

    await expect(DecapTurboBackend.preloadConfig(config)).rejects.toThrow('site not found');
  });
});
