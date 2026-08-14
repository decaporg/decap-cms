import DecapTurboGitLabBackend from '../implementation';

describe('turbo gitlab backend supabase session refresh', () => {
  // Loosely typed on purpose — these are minimal fixtures, not full Config
  // objects, mirroring how decap-cms-backend-turbo-github's own (plain .js) tests
  // construct backend config.
  const config: any = {
    backend: {
      repo: 'group/project',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not logout on non-terminal refresh failure in currentUser', async () => {
    const backend = new DecapTurboGitLabBackend(config);
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;

    const refreshError: any = new Error('network down');
    refreshError.isTerminal = false;

    backend.getRefreshedAccessToken = jest.fn().mockRejectedValue(refreshError);
    backend.logout = jest.fn().mockResolvedValue(undefined);

    const user = await backend.currentUser({ token: 'token' });

    expect(user.username).toBe('group');
    expect(backend.logout).not.toHaveBeenCalled();
  });

  it('logs out on terminal refresh failure in currentUser', async () => {
    const backend = new DecapTurboGitLabBackend(config);
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;

    const refreshError: any = new Error('invalid refresh token');
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
    const backend = new DecapTurboGitLabBackend(config, { updateUserCredentials });
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
      } as any);

    await expect(backend.getRefreshedAccessToken()).resolves.toBe('new-access-token');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(updateUserCredentials).toHaveBeenCalledTimes(1);
    expect(backend.supabaseAccessToken).toBe('new-access-token');
    expect(backend.supabaseRefreshToken).toBe('new-refresh-token');
  });

  it('marks invalid_grant as terminal and avoids retries', async () => {
    const backend = new DecapTurboGitLabBackend(config);
    backend.supabaseRefreshToken = 'refresh-token';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    } as any);

    await expect(backend.getRefreshedAccessToken()).rejects.toMatchObject({ isTerminal: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('scopes gl proxy requests with auth header, x-site-id header, and site_id query param', async () => {
    const backend = new DecapTurboGitLabBackend({
      ...config,
      backend: {
        ...config.backend,
        api_root: 'https://supabase.example/functions/v1/gl',
        turbo_site_id: 'site-123',
      },
    });
    backend.supabaseAccessToken = 'access-123';

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as any);

    // apiRequestFunction expects an Immutable-style ApiRequest — build a real
    // one via unsentRequest.fromURL rather than a hand-rolled fake, so this
    // test exercises the actual header/param shape sent.
    const { unsentRequest } = require('decap-cms-lib-util');
    const req = unsentRequest.fromURL(
      'https://supabase.example/functions/v1/gl/projects/group%2Fproject/repository/tree',
    );

    await backend.apiRequestFunction(req);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('site_id=site-123');
    expect(init.headers.Authorization).toBe('Bearer access-123');
    expect(init.headers['x-site-id']).toBe('site-123');
  });
});

describe('turbo gitlab backend preloadConfig', () => {
  afterEach(() => {
    delete (global as any).fetch;
  });

  it('returns the config unchanged when fully manually configured', async () => {
    const config = {
      backend: { supabase_app_id: 'app-id', supabase_anon_key: 'anon-key' },
    } as any;

    const actual = await DecapTurboGitLabBackend.preloadConfig(config);

    expect(actual).toBe(config);
  });

  it('throws when supabase_app_id is set without supabase_anon_key', async () => {
    const config = { backend: { supabase_app_id: 'app-id' } } as any;

    await expect(DecapTurboGitLabBackend.preloadConfig(config)).rejects.toThrow(
      /supabase_app_id.*without.*supabase_anon_key/,
    );
  });

  it('returns the config unchanged when nothing is configured at all', async () => {
    const config = { backend: {} } as any;

    const actual = await DecapTurboGitLabBackend.preloadConfig(config);

    expect(actual).toBe(config);
  });

  it('fetches and merges control-plane defaults when only turbo_site_id is set', async () => {
    const config = { backend: { turbo_site_id: 'site-123', repo: 'group/project' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    } as any);

    const actual = await DecapTurboGitLabBackend.preloadConfig(config);

    expect(actual.backend).toEqual({
      supabase_app_id: 'resolved-app-id',
      supabase_anon_key: 'resolved-key',
      turbo_site_id: 'site-123',
      repo: 'group/project',
    });
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('site_id=site-123');
  });

  it('throws when the control-plane config endpoint fails', async () => {
    const config = { backend: { turbo_site_id: 'site-123' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'site not found' }),
    } as any);

    await expect(DecapTurboGitLabBackend.preloadConfig(config)).rejects.toThrow('site not found');
  });
});

describe('turbo gitlab backend use_graphql rejection', () => {
  // Same rationale as decap-cms-backend-turbo-github's GitHub twin: GitLab's own
  // GraphQL client also builds its transport independently of
  // apiRequestFunction, so it would bypass the x-site-id/site_id tenant
  // scoping the shared `gl` Edge Function relies on.
  it('throws in the constructor when use_graphql is set', () => {
    const config = {
      backend: {
        repo: 'group/project',
        supabase_app_id: 'supabase-project-id',
        supabase_anon_key: 'supabase-anon-key',
        use_graphql: true,
      },
      media_folder: 'static/media',
    } as any;

    expect(() => new DecapTurboGitLabBackend(config)).toThrow(/use_graphql/);
  });
});
