import DecapTurboGitLabBackend from '../implementation';
import { recordCmsEvent } from '../telemetry';
import { recordProxyResponse } from '../saveMetrics';

jest.mock('../telemetry', () => ({ recordCmsEvent: jest.fn() }));

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

  describe('setActiveSiteAndRefresh', () => {
    it('refreshes an expired token before sending it, instead of PUTting a stale one', async () => {
      const backend = new DecapTurboGitLabBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) - 100;

      global.fetch = jest.fn((url: string) => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: 'fresh-token',
                refresh_token: 'refresh-token',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }) as any;

      await backend.setActiveSiteAndRefresh();

      const putCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
        url.includes('/auth/v1/user'),
      );
      expect(putCall[1].headers.Authorization).toBe('Bearer fresh-token');
    });

    it('retries once after a 401, refreshing the token in between', async () => {
      const backend = new DecapTurboGitLabBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      let putCallCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: 'fresh-token',
                refresh_token: 'refresh-token',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              }),
          });
        }
        putCallCount += 1;
        return Promise.resolve({ ok: putCallCount > 1, status: 401 });
      }) as any;

      await backend.setActiveSiteAndRefresh();

      const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
        url.includes('/auth/v1/user'),
      );
      expect(putCalls).toHaveLength(2);
      expect(putCalls[1][1].headers.Authorization).toBe('Bearer fresh-token');
    });

    it('throws a friendly session-expired error instead of the raw response when the retry also fails', async () => {
      const backend = new DecapTurboGitLabBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      global.fetch = jest.fn((url: string) => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: 'fresh-token',
                refresh_token: 'refresh-token',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              }),
          });
        }
        return Promise.resolve({ ok: false, status: 403 });
      }) as any;

      await expect(backend.setActiveSiteAndRefresh()).rejects.toThrow(
        'Session expired. Please log in again.',
      );
    });

    it('throws the friendly error without retrying the PUT when the reactive refresh itself is terminal', async () => {
      const backend = new DecapTurboGitLabBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      global.fetch = jest.fn((url: string) => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({ ok: false, status: 401 });
        }
        return Promise.resolve({ ok: false, status: 401 });
      }) as any;

      await expect(backend.setActiveSiteAndRefresh()).rejects.toThrow(
        'Session expired. Please log in again.',
      );
      const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
        url.includes('/auth/v1/user'),
      );
      expect(putCalls).toHaveLength(1);
    });

    it('does nothing when there is no access token or site id', async () => {
      const backend = new DecapTurboGitLabBackend(config);
      global.fetch = jest.fn() as any;

      await backend.setActiveSiteAndRefresh();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not throw when the PUT succeeds but the trailing opportunistic refresh fails', async () => {
      const backend = new DecapTurboGitLabBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'still-valid-token';
      backend.supabaseRefreshToken = 'already-rotated-refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      global.fetch = jest.fn((url: string) => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error_code: 'refresh_token_not_found' }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }) as any;

      await expect(backend.setActiveSiteAndRefresh()).resolves.toBeUndefined();
    });
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

  it('overrides a stale local repo/branch with the control plane\'s values', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', repo: 'stale/project', branch: 'stale-branch' },
    } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'group/project',
          branch: 'main',
        }),
    } as any);

    const actual = await DecapTurboGitLabBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('group/project');
    expect(actual.backend.branch).toBe('main');
  });

  it('fills in repo/branch from the control plane when config.yml omits them', async () => {
    const config = { backend: { turbo_site_id: 'site-123' } } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'group/project',
          branch: 'main',
        }),
    } as any);

    const actual = await DecapTurboGitLabBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('group/project');
    expect(actual.backend.branch).toBe('main');
  });

  it('leaves local repo/branch alone when the control plane does not return them', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', repo: 'group/project', branch: 'main' },
    } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    } as any);

    const actual = await DecapTurboGitLabBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('group/project');
    expect(actual.backend.branch).toBe('main');
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

describe('turbo gitlab backend persistEntry save metrics', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  // super.persistEntry — the real one drives the GitLab API client, which this
  // suite has no business standing up. Stubbing the prototype lets each test
  // decide what the save "cost" in proxied requests.
  const superPersistEntry = Object.getPrototypeOf(DecapTurboGitLabBackend.prototype);

  function makeBackend() {
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.baseUrl = 'https://sb.example.com';
    backend.supabaseAccessToken = 'access-token';
    backend.siteId = 'site-id';
    return backend;
  }

  function responseWith(serverTiming: string | null) {
    return {
      headers: { get: (name: string) => (name === 'Server-Timing' ? serverTiming : null) },
    } as unknown as Response;
  }

  const entry = {
    dataFiles: [{ slug: 'post', path: 'content/post.md', raw: 'hello' }],
    assets: [{ fileObj: { size: 2048 } }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports duration, round trips, upstream time and payload size', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockImplementation(async function (this: any) {
      recordProxyResponse(this.proxyMeter, responseWith('preamble;dur=20, upstream;dur=120'));
      return 'post';
    });

    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts' });

    expect(recordCmsEvent).toHaveBeenCalledTimes(1);
    const props = (recordCmsEvent as jest.Mock).mock.calls[0][5];

    expect(props.requests).toBe(1);
    expect(props.upstreamMs).toBe(120);
    expect(props.files).toBe(2);
    expect(props.bytes).toBe(2053);
    expect(typeof props.durationMs).toBe('number');
  });

  // Zero would read as "GitLab answered instantly", which is the one
  // conclusion the data must never support.
  it('omits upstreamMs entirely when no response carried a Server-Timing', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockImplementation(async function (this: any) {
      recordProxyResponse(this.proxyMeter, responseWith(null));
      return 'post';
    });

    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts' });

    const props = (recordCmsEvent as jest.Mock).mock.calls[0][5];
    expect(props.requests).toBe(1);
    expect('upstreamMs' in props).toBe(false);
  });

  // A meter left active would silently attribute every subsequent read to the
  // next save.
  it('clears the meter even when the save throws', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockRejectedValue(new Error('conflict'));

    const backend = makeBackend();

    await expect(backend.persistEntry(entry, { collectionName: 'posts' })).rejects.toThrow(
      'conflict',
    );
    expect(backend.proxyMeter).toBeNull();
    expect(recordCmsEvent).not.toHaveBeenCalled();
  });
});

describe('turbo gitlab backend logout', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  function loggedInBackend() {
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.supabaseAccessToken = 'access-token';
    backend.supabaseRefreshToken = 'refresh-token';
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    backend.supabaseIdentity = { user_email: 'editor@example.com' };
    backend.supabase.setAccessToken('access-token');
    return backend;
  }

  it('clears the Supabase session the auth store does not know about', async () => {
    const backend = loggedInBackend();
    await backend.currentUser({ token: 'access-token' });

    await backend.logout();

    expect(backend.supabaseAccessToken).toBeNull();
    expect(backend.supabaseRefreshToken).toBeNull();
    expect(backend.supabaseExpiresAt).toBeNull();
    expect(backend.supabaseIdentity).toBeNull();
    expect(backend.supabase.supabaseAccessToken).toBeNull();
    expect(backend._currentUserPromise).toBeUndefined();
  });

  it('reports unauthenticated status after logout', async () => {
    const backend = loggedInBackend();
    expect((await backend.status()).auth.status).toBe(true);

    await backend.logout();

    expect((await backend.status()).auth.status).toBe(false);
  });
});

describe('turbo gitlab backend user identity', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  it('reports the signed-in Turbo user, not the project owner', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.supabaseIdentity = {
      user_email: 'editor@example.com',
      user_metadata: { full_name: 'Ed Editor', picture: 'https://cdn.example.com/ed.png' },
    };

    const user = await backend.currentUser({ token: 'token' });

    expect(user.name).toBe('Ed Editor');
    expect(user.email).toBe('editor@example.com');
    expect(user.avatar_url).toBe('https://cdn.example.com/ed.png');
    // `username` stays the project owner: other GitLab code paths use it as an
    // identifier, not as a display name.
    expect(user.username).toBe('group');
  });

  it('falls back to the project owner when no session identity is known', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);

    const user = await backend.currentUser({ token: 'token' });

    expect(user.name).toBe('group');
    expect(user.email).toBeUndefined();
    expect(user.avatar_url).toBeNull();
  });
});
