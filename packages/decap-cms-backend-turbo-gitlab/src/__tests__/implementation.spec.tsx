import { unsentRequest } from 'decap-cms-lib-util';
import { API } from 'decap-cms-backend-gitlab';

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

    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as any);

    // apiRequestFunction expects an Immutable-style ApiRequest — build a real
    // one via unsentRequest.fromURL rather than a hand-rolled fake, so this
    // test exercises the actual header/param shape sent.
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

  describe('fetchTurboPermissions', () => {
    it('rejects and drops the session when the user is not a member of the site', async () => {
      const backend = new DecapTurboGitLabBackend({
        ...config,
        backend: { ...config.backend, turbo_site_id: 'site-123' },
      });
      backend.supabaseAccessToken = 'access-123';
      backend.supabaseRefreshToken = 'refresh-123';

      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

      await expect(backend.fetchTurboPermissions()).rejects.toThrow(
        "doesn't have access to this site",
      );
      expect(backend.supabaseAccessToken).toBeNull();
      expect(backend.supabaseRefreshToken).toBeNull();
    });

    it('treats any other failure as soft, so a blip does not block login', async () => {
      const backend = new DecapTurboGitLabBackend({
        ...config,
        backend: { ...config.backend, turbo_site_id: 'site-123' },
      });
      backend.supabaseAccessToken = 'access-123';

      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      await expect(backend.fetchTurboPermissions()).resolves.toBeUndefined();
      expect(backend.supabaseAccessToken).toBe('access-123');
    });
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

describe('turbo gitlab backend proxy auth answers', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      api_root: 'https://supabase.example/functions/v1/gl',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
      turbo_site_id: 'site-123',
    },
    media_folder: 'static/media',
  };
  const syncUrl = 'https://supabase.example/functions/v1/gl/_content/sync';
  const treeUrl =
    'https://supabase.example/functions/v1/gl/projects/group%2Fproject/repository/tree';

  function reply(status: number, body: string, contentType = 'text/plain') {
    const response: any = {
      ok: status < 400,
      status,
      headers: new Headers({ 'Content-Type': contentType }),
      text: () => Promise.resolve(body),
      json: () => Promise.resolve(JSON.parse(body)),
    };
    response.clone = () => ({ ...response });
    return response;
  }
  function refused() {
    return reply(401, 'Unauthorized');
  }
  function ok() {
    return reply(200, '{}', 'application/json');
  }

  function backendWithSession(options = {}) {
    const backend: any = new DecapTurboGitLabBackend(config, options);
    backend.supabaseAccessToken = 'old-token';
    backend.supabaseRefreshToken = 'refresh-token';
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    return backend;
  }

  function refreshesTo(backend: any, token: string) {
    backend.getRefreshedAccessToken = jest.fn().mockImplementation(async () => {
      backend.supabaseAccessToken = token;
      return token;
    });
  }

  function refreshIsRefused(backend: any) {
    const terminal = Object.assign(new Error('refresh_token_not_found'), { isTerminal: true });
    backend.getRefreshedAccessToken = jest.fn().mockRejectedValue(terminal);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('glFetch', () => {
    it('refreshes once on a proxy 401 and retries with the new token', async () => {
      const backend = backendWithSession();
      refreshesTo(backend, 'new-token');
      global.fetch = jest.fn().mockResolvedValueOnce(refused()).mockResolvedValueOnce(ok());

      await backend.glFetch(syncUrl, { method: 'POST' });

      expect(backend.getRefreshedAccessToken).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect((global.fetch as jest.Mock).mock.calls[1][1].headers.Authorization).toBe(
        'Bearer new-token',
      );
    });

    it('ends the session once when the refresh is refused, then fails fast', async () => {
      const onSessionInvalid = jest.fn();
      const backend = backendWithSession({ onSessionInvalid });
      refreshIsRefused(backend);
      global.fetch = jest.fn().mockResolvedValue(refused());

      await expect(backend.glFetch(syncUrl, { method: 'POST' })).rejects.toMatchObject({
        status: 401,
      });
      await expect(backend.glFetch(syncUrl, { method: 'POST' })).rejects.toThrow(
        'Session expired. Please log in again.',
      );

      expect(onSessionInvalid).toHaveBeenCalledTimes(1);
      expect(onSessionInvalid).toHaveBeenCalledWith('Session expired. Please log in again.');
      // The second call never reached the network.
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(backend.supabaseAccessToken).toBeNull();
    });

    it('ends the session when the retry is refused too', async () => {
      const onSessionInvalid = jest.fn();
      const backend = backendWithSession({ onSessionInvalid });
      refreshesTo(backend, 'new-token');
      global.fetch = jest.fn().mockResolvedValue(refused());

      await expect(backend.glFetch(syncUrl, { method: 'POST' })).rejects.toMatchObject({
        status: 401,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    });

    it('does not log out over a GitLab 401 passed through the proxy', async () => {
      const onSessionInvalid = jest.fn();
      const backend = backendWithSession({ onSessionInvalid });
      backend.getRefreshedAccessToken = jest.fn();
      global.fetch = jest
        .fn()
        .mockResolvedValue(reply(401, '{"message":"401 Unauthorized"}', 'application/json'));

      await expect(backend.glFetch(syncUrl, { method: 'POST' })).rejects.toMatchObject({
        status: 401,
        message: '401 Unauthorized',
      });

      expect(backend.getRefreshedAccessToken).not.toHaveBeenCalled();
      expect(onSessionInvalid).not.toHaveBeenCalled();
    });

    it('ends the session on a 403 for a site the user lost access to', async () => {
      const onSessionInvalid = jest.fn();
      const backend = backendWithSession({ onSessionInvalid });
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          reply(403, '{"error":"Forbidden: no access to requested site"}', 'application/json'),
        );

      await expect(backend.glFetch(syncUrl, { method: 'POST' })).rejects.toMatchObject({
        status: 403,
      });

      expect(onSessionInvalid).toHaveBeenCalledWith(
        expect.stringContaining("doesn't have access to this site"),
      );
    });

    it("shows the proxy's error sentence rather than the JSON around it", async () => {
      const backend = backendWithSession();
      global.fetch = jest
        .fn()
        .mockResolvedValue(reply(403, '{"error":"This site is read-only"}', 'application/json'));

      await expect(backend.glFetch(syncUrl, { method: 'POST' })).rejects.toThrow(
        /^This site is read-only$/,
      );
    });
  });

  describe('apiRequestFunction', () => {
    it('refreshes once on a proxy 401 and retries with the new token', async () => {
      const backend = backendWithSession();
      refreshesTo(backend, 'new-token');
      global.fetch = jest.fn().mockResolvedValueOnce(refused()).mockResolvedValueOnce(ok());

      const response = await backend.apiRequestFunction(unsentRequest.fromURL(treeUrl));

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect((global.fetch as jest.Mock).mock.calls[1][1].headers.Authorization).toBe(
        'Bearer new-token',
      );
    });

    it('ends the session once, and answers later requests without the network', async () => {
      const onSessionInvalid = jest.fn();
      const backend = backendWithSession({ onSessionInvalid });
      refreshIsRefused(backend);
      global.fetch = jest.fn().mockResolvedValue(refused());

      const first = await backend.apiRequestFunction(unsentRequest.fromURL(treeUrl));
      const second = await backend.apiRequestFunction(unsentRequest.fromURL(treeUrl));

      expect(first.status).toBe(401);
      expect(second.status).toBe(401);
      await expect(second.json()).resolves.toEqual({
        message: 'Session expired. Please log in again.',
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    });

    it('fails a GitLab API call at once with the reason, without backing off', async () => {
      // lib-util's requestWithBackoff retries a throw five times with growing
      // pauses; a latched session must not throw into it.
      const backend = backendWithSession();
      backend.sessionInvalidMessage = 'Session expired. Please log in again.';
      global.fetch = jest.fn();
      const api = new API({
        token: 'old-token',
        branch: 'main',
        repo: 'group/project',
        apiRoot: config.backend.api_root,
        requestFunction: backend.apiRequestFunction,
      } as any);

      await expect(api.requestJSON('/user')).rejects.toMatchObject({
        status: 401,
        message: 'Session expired. Please log in again.',
      });
      await expect(api.requestText('/user')).rejects.toMatchObject({
        message: 'Session expired. Please log in again.',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("makes a GitLab API call read the proxy's error sentence", async () => {
      const backend = backendWithSession();
      global.fetch = jest
        .fn()
        .mockResolvedValue(reply(403, '{"error":"This site is read-only"}', 'application/json'));
      const api = new API({
        token: 'old-token',
        branch: 'main',
        repo: 'group/project',
        apiRoot: config.backend.api_root,
        requestFunction: backend.apiRequestFunction,
      } as any);

      await expect(api.requestJSON('/user')).rejects.toMatchObject({
        status: 403,
        message: 'This site is read-only',
      });
    });
  });

  it('reads a missing expires_at from the token, so the session still refreshes', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
    const exp = Math.floor(Date.now() / 1000) + 10;
    backend.supabaseAccessToken = `header.${btoa(JSON.stringify({ exp }))}.signature`;
    backend.supabaseRefreshToken = 'refresh-token';
    refreshesTo(backend, 'new-token');

    await backend.refreshSessionIfNeeded();

    expect(backend.getRefreshedAccessToken).toHaveBeenCalledTimes(1);
  });

  it('ends the session through core when a proactive refresh is refused', async () => {
    const onSessionInvalid = jest.fn();
    const backend = backendWithSession({ onSessionInvalid });
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;
    refreshIsRefused(backend);

    await expect(backend.refreshSessionIfNeeded()).rejects.toThrow(
      'Session expired. Please log in again.',
    );
    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(backend.sessionInvalidMessage).toBe('Session expired. Please log in again.');
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

  it("overrides a stale local repo with the control plane's value", async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', repo: 'stale/project' },
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
  });

  // One sites row serves every deploy of a project, so its branch cannot be
  // the one a staging deploy edits; the deploy's own config.yml says which
  // branch it is on.
  it('keeps the branch from config.yml over the control plane branch', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', branch: 'develop' },
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
    expect(actual.backend.branch).toBe('develop');
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

describe('turbo gitlab backend editor bridge', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      branch: 'main',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
      turbo_site_id: 'site-123',
    },
  };

  function editorApi() {
    return {
      getCurrentEntry: jest.fn(() => null),
      applyFieldPatch: jest.fn(() => ({ applied: [], rejected: [] })),
      onEditorChange: jest.fn(() => () => undefined),
    };
  }

  it('stays off unless the site opts in', () => {
    // Still in development: on by default it would advertise itself on every
    // entry and upload every editor's unsaved draft, agent or not.
    const backend = new DecapTurboGitLabBackend(config);
    const editor = editorApi();
    const registerFieldAction = jest.fn();

    backend.attachEditor({ editor, registerFieldAction } as any);

    expect(backend.editorBridgeInstance).toBeNull();
    expect(editor.onEditorChange).not.toHaveBeenCalled();
    expect(registerFieldAction).not.toHaveBeenCalled();
  });

  it('starts when the site sets editor_bridge: true', () => {
    const backend = new DecapTurboGitLabBackend({
      ...config,
      backend: { ...config.backend, editor_bridge: true },
    });
    const editor = editorApi();
    const registerFieldAction = jest.fn();

    backend.attachEditor({ editor, registerFieldAction } as any);

    expect(backend.editorBridgeInstance).not.toBeNull();
    expect(editor.onEditorChange).toHaveBeenCalledTimes(1);
    expect(registerFieldAction).toHaveBeenCalledTimes(1);
    backend.editorBridgeInstance!.stop();
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

  // decap-turbo H12: authorEmail was a second copy of an email the row
  // already identifies through the server-derived user_id, stored alongside
  // the content path and slug in a table retained 180 days.
  it('sends no email address in the props', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post' as any);

    const backend = makeBackend();
    (backend as any).commitAuthorEmailFallback = 'editor@example.test';
    await backend.persistEntry(entry, { collectionName: 'posts' } as any);

    const props = (recordCmsEvent as jest.Mock).mock.calls[0][5];
    expect(props).not.toHaveProperty('authorEmail');
    expect(JSON.stringify(props)).not.toContain('@');
  });

  // decap-turbo L8: both used to report the site's branch, so a draft was
  // logged and displayed as a publish.
  it('reports the site branch for a normal save', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post' as any);

    const backend = makeBackend();
    (backend as any).branch = 'turbo';
    await backend.persistEntry(entry, { collectionName: 'posts' } as any);

    const props = (recordCmsEvent as jest.Mock).mock.calls[0][5];
    expect(props.branch).toBe('turbo');
    expect(props.workflow).toBe(false);
  });

  it('reports the workflow branch for an editorial-workflow save', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post' as any);

    const backend = makeBackend();
    (backend as any).branch = 'turbo';
    await backend.persistEntry(entry, { collectionName: 'posts', useWorkflow: true } as any);

    const props = (recordCmsEvent as jest.Mock).mock.calls[0][5];
    expect(props.branch).toBe('cms/posts/post');
    expect(props.workflow).toBe(true);
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

  it('revokes a session Turbo minted for this CMS alone', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const backend = loggedInBackend();
    backend.dedicatedSession = true;

    await backend.logout();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://supabase-project-id.supabase.co/auth/v1/logout?scope=local',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
  });

  it('never revokes a session shared with the Turbo dashboard', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const backend = loggedInBackend();

    await backend.logout();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports unauthenticated status after logout', async () => {
    const backend = loggedInBackend();
    expect((await backend.status()).auth.status).toBe(true);

    await backend.logout();

    expect((await backend.status()).auth.status).toBe(false);
  });
});

describe('turbo gitlab backend session shared across tabs', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  // A Supabase access token is only read for its `session_id` claim here.
  function accessToken(sessionId: string, version = 1) {
    return `header.${btoa(JSON.stringify({ session_id: sessionId, v: version }))}.signature`;
  }

  function tabWithExpiringSession(stored: any) {
    const backend: any = new DecapTurboGitLabBackend(config, {
      updateUserCredentials: jest.fn(),
      retrieveUserCredentials: () => stored,
    });
    backend.supabaseAccessToken = accessToken('session-1');
    backend.supabaseRefreshToken = 'refresh-1';
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;
    backend.delay = jest.fn().mockResolvedValue(undefined);
    return backend;
  }

  function refreshResponse() {
    return {
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: accessToken('session-1', 3),
          refresh_token: 'refresh-3',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue(refreshResponse());
  });

  it('adopts the pair another tab refreshed instead of spending a dead refresh token', async () => {
    const rotated = {
      access_token: accessToken('session-1', 2),
      refresh_token: 'refresh-2',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    const backend = tabWithExpiringSession(rotated);

    await expect(backend.getRefreshedAccessToken()).resolves.toBe(rotated.access_token);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(backend.supabaseRefreshToken).toBe('refresh-2');
    expect(backend.supabaseExpiresAt).toBe(rotated.expires_at);
    expect(backend.supabase.supabaseAccessToken).toBe(rotated.access_token);
  });

  it('refreshes with the adopted token when the stored pair is itself expiring', async () => {
    const backend = tabWithExpiringSession({
      access_token: accessToken('session-1', 2),
      refresh_token: 'refresh-2',
      expires_at: Math.floor(Date.now() / 1000) + 10,
    });

    await backend.getRefreshedAccessToken();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
      refresh_token: 'refresh-2',
    });
    expect(backend.supabaseRefreshToken).toBe('refresh-3');
  });

  it('does not adopt a stored session from a different login', async () => {
    const backend = tabWithExpiringSession({
      access_token: accessToken('session-2'),
      refresh_token: 'refresh-other',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    await backend.getRefreshedAccessToken();

    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
      refresh_token: 'refresh-1',
    });
  });

  it('refreshes normally when nothing newer is stored', async () => {
    const backend = tabWithExpiringSession(null);

    await backend.getRefreshedAccessToken();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(backend.supabaseRefreshToken).toBe('refresh-3');
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

describe('turbo gitlab backend notes', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  const USER_ID = '3f2b1c4d-0000-4a5b-8c9d-1e2f3a4b5c6d';

  function segment(value: unknown) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  }

  function tokenFor(claims: Record<string, unknown>) {
    return `${segment({ alg: 'HS256' })}.${segment(claims)}.signature`;
  }

  function signedIn(overrides: Record<string, unknown> = {}) {
    const backend = new DecapTurboGitLabBackend(config);
    backend.supabaseAccessToken = tokenFor({ sub: USER_ID });
    backend.supabaseIdentity = {
      user_email: 'decap@p-m.si',
      user_metadata: { full_name: 'Decap Tester' },
      ...overrides,
    } as any;
    return backend;
  }

  it('attributes a note to the editor without asking the proxy who they are', async () => {
    // GitLabBackend reads the username off `api.user()`, which here is the
    // proxy's synthesized answer built from the email's local part - a round
    // trip, a name nobody recognises, and a value two editors can share.
    const backend = signedIn();
    backend.api = { user: jest.fn() } as any;

    expect(await backend.noteAuthorIdentity()).toEqual({
      author: 'Decap Tester',
      authorId: USER_ID,
    });
    expect((backend.api as any).user).not.toHaveBeenCalled();
  });

  it('falls back to the email when the session carries no name', async () => {
    const backend = signedIn({ user_metadata: {} });
    expect((await backend.noteAuthorIdentity()).author).toBe('decap');
  });

  it('records no id when there is no session to read one from', async () => {
    const backend = signedIn();
    backend.supabaseAccessToken = null;

    // Both or neither: lib-util drops a name with no id to compare against,
    // and ownership falls back to comparing names.
    expect((await backend.noteAuthorIdentity()).authorId).toBeUndefined();
  });
});

describe('turbo gitlab backend authenticate', () => {
  const config: any = {
    backend: {
      repo: 'group/project',
      branch: 'main',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
      turbo_site_id: 'site-123',
    },
    media_folder: 'static/media',
  };

  function ready(backend: any) {
    backend.fetchTurboPermissions = jest.fn().mockResolvedValue(undefined);
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const target = String(url);
      if (target.includes('/user')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: () => Promise.resolve({ id: 1, username: 'decap', name: 'Decap Tester' }),
          text: () => Promise.resolve('{}'),
        });
      }
      // hasWriteAccess reads the project and looks at its permissions.
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () =>
          Promise.resolve({ permissions: { project_access: { access_level: 40 } }, id: 7 }),
        text: () => Promise.resolve('{}'),
      });
    }) as any;
    return backend;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the notes api and polling manager, which the base authenticate would have', async () => {
    // This override replaces GitLabBackend.authenticate wholesale, and that is
    // the only place the two are built - without this the notes pane has no
    // API to call and nothing watching the thread.
    const backend: any = ready(new DecapTurboGitLabBackend(config));

    await backend.authenticate({ token: 'gl-token', access_token: 'access-123' });

    expect(backend.notesApi).toBeDefined();
    expect(backend.pollingManager).toBeDefined();

    await backend.logout();
    expect(backend.pollingManager).toBeUndefined();
  });

  it('a new login clears the latch', async () => {
    const backend: any = ready(new DecapTurboGitLabBackend(config));
    backend.sessionInvalidMessage = 'Session expired. Please log in again.';

    await backend.authenticate({ token: 'gl-token', access_token: 'access-123' });

    expect(backend.sessionInvalidMessage).toBeNull();
  });

  it("replaces the previous session's manager rather than leaving it polling", async () => {
    const backend: any = ready(new DecapTurboGitLabBackend(config));

    await backend.authenticate({ token: 'gl-token', access_token: 'access-123' });
    const first = backend.pollingManager;
    const destroy = jest.spyOn(first, 'destroy');

    await backend.authenticate({ token: 'gl-token-2', access_token: 'access-456' });

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(backend.pollingManager).not.toBe(first);
    expect(backend.notesApi).toBeDefined();
  });
});
