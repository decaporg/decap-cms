import DecapTurboGitHubBackend from '../implementation';
import { recordCmsEvent } from '../telemetry';
import { recordProxyResponse } from '../saveMetrics';

jest.mock('../telemetry', () => ({ recordCmsEvent: jest.fn() }));

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
    const backend = new DecapTurboGitHubBackend(config);
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
    const backend = new DecapTurboGitHubBackend(config);
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
    const backend = new DecapTurboGitHubBackend(config, { updateUserCredentials });
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
    const backend = new DecapTurboGitHubBackend(config);
    backend.supabaseRefreshToken = 'refresh-token';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    await expect(backend.getRefreshedAccessToken()).rejects.toMatchObject({ isTerminal: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('marks refresh_token_not_found as terminal, so a dead session cannot storm', async () => {
    // This is the code GoTrue actually returns for a rotated-away or expired
    // refresh token. It used to fall outside the terminal allow-list, so it
    // was retried, swallowed, and left every subsequent request to 401 —
    // 87 refresh POSTs in 41 seconds on one collection load, until GoTrue's
    // rate limiter answered 429 and the session could never recover.
    const backend = new DecapTurboGitHubBackend(config);
    backend.supabaseRefreshToken = 'rotated-away-token';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          code: 400,
          error_code: 'refresh_token_not_found',
          msg: 'Invalid Refresh Token: Refresh Token Not Found',
        }),
    });

    await expect(backend.getRefreshedAccessToken()).rejects.toMatchObject({ isTerminal: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('logs out once on a terminal refresh instead of letting callers reuse a dead token', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.supabaseRefreshToken = 'rotated-away-token';
    backend.supabaseAccessToken = 'expired-access-token';
    // Inside the refresh buffer, so refreshSessionIfNeeded actually runs.
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;
    backend.logout = jest.fn();

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error_code: 'refresh_token_not_found' }),
    });

    await expect(backend.refreshSessionIfNeeded()).rejects.toThrow(/log in again/i);
    expect(backend.logout).toHaveBeenCalledTimes(1);
  });

  it('stops re-attempting a transiently failed refresh for a cooldown window', async () => {
    // A rate limit or a 5xx is not worth one three-attempt cycle per request:
    // refreshedTokenPromise only dedupes refreshes that overlap in flight, and
    // a collection load fires its entries sequentially.
    const backend = new DecapTurboGitHubBackend(config);
    backend.supabaseRefreshToken = 'refresh-token';
    backend.supabaseAccessToken = 'expired-access-token';
    backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;
    backend.delay = jest.fn().mockResolvedValue(undefined);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error_code: 'over_request_rate_limit' }),
    });

    // Non-terminal: it must NOT log the user out.
    await expect(backend.refreshSessionIfNeeded()).resolves.toBeUndefined();
    const afterFirst = global.fetch.mock.calls.length;
    expect(afterFirst).toBe(3); // the three in-cycle attempts

    // Three more requests arriving right behind it add nothing.
    await backend.refreshSessionIfNeeded();
    await backend.refreshSessionIfNeeded();
    await backend.refreshSessionIfNeeded();
    expect(global.fetch).toHaveBeenCalledTimes(afterFirst);

    // Once the window passes, it is willing to try again.
    backend.refreshBlockedUntil = 0;
    await backend.refreshSessionIfNeeded();
    expect(global.fetch.mock.calls.length).toBeGreaterThan(afterFirst);
  });

  it('scopes gh proxy requests with auth header, x-site-id, and site_id query param', async () => {
    const backend = new DecapTurboGitHubBackend({
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
    const backend = new DecapTurboGitHubBackend(config);

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
      const backend = new DecapTurboGitHubBackend(config);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve('') })
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('') });

      await backend.pollUntilForkExists({ repo: 'owner/repo-fork', token: 'token' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('propagates a non-404 failure instead of retrying forever', async () => {
      const backend = new DecapTurboGitHubBackend(config);

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
      const backend = new DecapTurboGitHubBackend(config);
      global.fetch = jest.fn();

      const result = await backend.fetchTurboPermissions();

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches and returns permissions scoped to the current site', async () => {
      const backend = new DecapTurboGitHubBackend({
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

    it('refreshes an expiring token before sending it, instead of 401ing', async () => {
      const backend = new DecapTurboGitHubBackend({
        ...config,
        backend: { ...config.backend, turbo_site_id: 'site-123' },
      });
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-1';
      // Inside REFRESH_BUFFER_SECONDS, so this token is about to expire.
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 10;

      backend.getRefreshedAccessToken = jest.fn().mockImplementation(async () => {
        backend.supabaseAccessToken = 'fresh-token';
        backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;
        return 'fresh-token';
      });

      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await backend.fetchTurboPermissions();

      // `authenticate` runs this concurrently with `currentUser`, so it cannot
      // rely on currentUser's refresh having landed first. A 401 here does not
      // fail loudly — it silently drops the editor's collection restrictions.
      expect(backend.getRefreshedAccessToken).toHaveBeenCalled();
      const [, init] = global.fetch.mock.calls[0];
      expect(init.headers.Authorization).toBe('Bearer fresh-token');
    });

    it('returns undefined and warns when the permissions endpoint fails', async () => {
      const backend = new DecapTurboGitHubBackend({
        ...config,
        backend: { ...config.backend, turbo_site_id: 'site-123' },
      });
      backend.supabaseAccessToken = 'access-123';

      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await backend.fetchTurboPermissions();

      expect(result).toBeUndefined();
    });
  });

  describe('setActiveSiteAndRefresh', () => {
    it('refreshes an expired token before sending it, instead of PUTting a stale one', async () => {
      const backend = new DecapTurboGitHubBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) - 100;

      global.fetch = jest.fn(url => {
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
      });

      await backend.setActiveSiteAndRefresh();

      const putCall = global.fetch.mock.calls.find(([url]) => url.includes('/auth/v1/user'));
      expect(putCall[1].headers.Authorization).toBe('Bearer fresh-token');
    });

    it('retries once after a 401, refreshing the token in between', async () => {
      const backend = new DecapTurboGitHubBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      let putCallCount = 0;
      global.fetch = jest.fn(url => {
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
      });

      await backend.setActiveSiteAndRefresh();

      const putCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/auth/v1/user'));
      expect(putCalls).toHaveLength(2);
      expect(putCalls[1][1].headers.Authorization).toBe('Bearer fresh-token');
    });

    it('throws a friendly session-expired error instead of the raw response when the retry also fails', async () => {
      const backend = new DecapTurboGitHubBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      global.fetch = jest.fn(url => {
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
      });

      await expect(backend.setActiveSiteAndRefresh()).rejects.toThrow(
        'Session expired. Please log in again.',
      );
    });

    it('throws the friendly error without retrying the PUT when the reactive refresh itself is terminal', async () => {
      const backend = new DecapTurboGitHubBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'stale-token';
      backend.supabaseRefreshToken = 'refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      global.fetch = jest.fn(url => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({ ok: false, status: 401 });
        }
        return Promise.resolve({ ok: false, status: 401 });
      });

      await expect(backend.setActiveSiteAndRefresh()).rejects.toThrow(
        'Session expired. Please log in again.',
      );
      const putCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/auth/v1/user'));
      expect(putCalls).toHaveLength(1);
    });

    it('does nothing when there is no access token or site id', async () => {
      const backend = new DecapTurboGitHubBackend(config);
      global.fetch = jest.fn();

      await backend.setActiveSiteAndRefresh();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not throw when the PUT succeeds but the trailing opportunistic refresh fails', async () => {
      const backend = new DecapTurboGitHubBackend(config);
      backend.siteId = 'site-123';
      backend.supabaseAccessToken = 'still-valid-token';
      backend.supabaseRefreshToken = 'already-rotated-refresh-token';
      backend.supabaseExpiresAt = Math.floor(Date.now() / 1000) + 3600;

      global.fetch = jest.fn(url => {
        if (url.includes('/auth/v1/token')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error_code: 'refresh_token_not_found' }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await expect(backend.setActiveSiteAndRefresh()).resolves.toBeUndefined();
    });
  });
});

describe('turbo backend authenticate', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      // Always present in practice: `preloadConfig` takes repo and branch from
      // the authoritative `sites` row, so `isBranchConfigured` is true and the
      // default-branch lookup never runs.
      branch: 'main',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
      turbo_site_id: 'site-123',
    },
    media_folder: 'static/media',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not read repo metadata, because Turbo commits as the App and never reads the answer', async () => {
    const backend = new DecapTurboGitHubBackend(config);

    global.fetch = jest.fn().mockImplementation(url => {
      if (String(url).includes('/functions/v1/permissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ collections: {} }) });
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    const user = await backend.authenticate({
      token: 'gh-token',
      access_token: 'access-123',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      email: 'editor@example.com',
      // Already the active site, so authenticate skips the one-off
      // active_site_id write and this test sees only the steady-state requests.
      user_metadata: { active_site_id: 'site-123' },
    });

    expect(user.login).toBe('owner');

    // GitHubBackend.authenticate would call hasWriteAccess() here, a
    // `GET /repos/{owner}/{repo}` whose result Turbo discards
    // (bypassWriteAccessCheckForAppTokens). It sat on the critical path of
    // every CMS load, so it must stay gone.
    const requested = global.fetch.mock.calls.map(([url]) => String(url));
    expect(requested.some(url => /\/repos\/owner\/repo(\?|$)/.test(url))).toBe(false);
    expect(requested.some(url => url.includes('/functions/v1/permissions'))).toBe(true);
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

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

    expect(actual).toBe(config);
  });

  it('throws when supabase_app_id is set without supabase_anon_key', async () => {
    const config = { backend: { supabase_app_id: 'app-id' } };

    await expect(DecapTurboGitHubBackend.preloadConfig(config)).rejects.toThrow(
      /supabase_app_id.*without.*supabase_anon_key/,
    );
  });

  it('returns the config unchanged when nothing is configured at all', async () => {
    const config = { backend: {} };

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

    expect(actual).toBe(config);
  });

  it('fetches and merges control-plane defaults when only turbo_site_id is set', async () => {
    const config = { backend: { turbo_site_id: 'site-123', repo: 'owner/repo' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    });

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

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

    await expect(DecapTurboGitHubBackend.preloadConfig(config)).rejects.toThrow('site not found');
  });

  it("overrides a stale local repo with the control plane's value", async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', repo: 'stale/repo' },
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'owner/repo',
          branch: 'main',
        }),
    });

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
  });

  // One sites row serves every deploy of a repo, so its branch cannot be the
  // one a staging deploy edits; the deploy's own config.yml says which branch
  // it is on.
  it('keeps the branch from config.yml over the control plane branch', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', branch: 'develop' },
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'owner/repo',
          branch: 'main',
        }),
    });

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
    expect(actual.backend.branch).toBe('develop');
  });

  it('fills in repo/branch from the control plane when config.yml omits them', async () => {
    const config = { backend: { turbo_site_id: 'site-123' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supabase_app_id: 'resolved-app-id',
          supabase_anon_key: 'resolved-key',
          repo: 'owner/repo',
          branch: 'main',
        }),
    });

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
    expect(actual.backend.branch).toBe('main');
  });

  it('leaves local repo/branch alone when the control plane does not return them', async () => {
    const config = {
      backend: { turbo_site_id: 'site-123', repo: 'owner/repo', branch: 'main' },
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ supabase_app_id: 'resolved-app-id', supabase_anon_key: 'resolved-key' }),
    });

    const actual = await DecapTurboGitHubBackend.preloadConfig(config);

    expect(actual.backend.repo).toBe('owner/repo');
    expect(actual.backend.branch).toBe('main');
  });
});

describe('turbo backend use_graphql rejection', () => {
  // GraphQLAPI builds its own Apollo transport straight off the constructor
  // config and never goes through setScopedApiRequestBuilder's patched
  // urlFor/requestHeaders — so a GraphQL-mode site would silently bypass the
  // x-site-id/site_id tenant scoping the shared `gh` Edge Function relies on.
  it('throws in the constructor when use_graphql is set', () => {
    const config = {
      backend: {
        repo: 'owner/repo',
        supabase_app_id: 'supabase-project-id',
        supabase_anon_key: 'supabase-anon-key',
        use_graphql: true,
      },
      media_folder: 'static/media',
    };

    expect(() => new DecapTurboGitHubBackend(config)).toThrow(/use_graphql/);
  });
});

describe('turbo backend persistEntry save metrics', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  // super.persistEntry — the real one drives the GitHub API client, which this
  // suite has no business standing up. Stubbing the prototype lets each test
  // decide what the save "cost" in proxied requests.
  const superPersistEntry = Object.getPrototypeOf(DecapTurboGitHubBackend.prototype);

  function makeBackend() {
    const backend = new DecapTurboGitHubBackend(config);
    backend.baseUrl = 'https://sb.example.com';
    backend.supabaseAccessToken = 'access-token';
    backend.siteId = 'site-id';
    return backend;
  }

  function responseWith(serverTiming) {
    return { headers: { get: name => (name === 'Server-Timing' ? serverTiming : null) } };
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
    jest.spyOn(superPersistEntry, 'persistEntry').mockImplementation(async function () {
      // Stands in for the N+4 proxied requests a real save makes.
      recordProxyResponse(this.proxyMeter, responseWith('preamble;dur=20, upstream;dur=120'));
      recordProxyResponse(this.proxyMeter, responseWith('preamble;dur=15, upstream;dur=80'));
      return 'post';
    });

    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts' });

    expect(recordCmsEvent).toHaveBeenCalledTimes(1);
    const props = recordCmsEvent.mock.calls[0][5];

    expect(props.requests).toBe(2);
    expect(props.upstreamMs).toBe(200);
    expect(props.files).toBe(2);
    expect(props.bytes).toBe(2053);
    expect(typeof props.durationMs).toBe('number');
    expect(props.durationMs).toBeGreaterThanOrEqual(0);
  });

  // Zero would read as "GitHub answered instantly", which is the one
  // conclusion the data must never support.
  it('omits upstreamMs entirely when no response carried a Server-Timing', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockImplementation(async function () {
      recordProxyResponse(this.proxyMeter, responseWith(null));
      return 'post';
    });

    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts' });

    const props = recordCmsEvent.mock.calls[0][5];
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

// The contract §A4's toast is built on: which commit to watch, and when there
// is nothing to watch at all. See decap-turbo/docs/deploy-status-plan.md §A3.
describe('turbo backend deploy watch', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      // Always set in practice — `preloadConfig` takes it from the sites row —
      // and load-bearing here: only a commit on the site's own branch can
      // produce a deploy the editor is waiting for.
      branch: 'main',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  const superPersistEntry = Object.getPrototypeOf(DecapTurboGitHubBackend.prototype);

  const entry = {
    dataFiles: [{ slug: 'post', path: 'content/post.md', raw: 'hello' }],
    assets: [],
  };

  function makeBackend() {
    const backend = new DecapTurboGitHubBackend(config);
    backend.baseUrl = 'https://sb.example.com';
    backend.supabaseAccessToken = 'access-token';
    backend.siteId = 'site-id';
    return backend;
  }

  function deploymentRow(state) {
    return {
      commit_sha: 'sha-1',
      source: 'github_deployment',
      external_id: '42',
      provider_label: 'Netlify',
      state,
      target_url: 'https://site.example',
      error_message: null,
      started_at: '2026-09-02T10:00:00Z',
      finished_at: '2026-09-02T10:01:00Z',
      updated_at: '2026-09-02T10:01:00Z',
    };
  }

  async function flush() {
    for (let tick = 0; tick < 5; tick += 1) {
      await Promise.resolve();
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('remembers the commit a save produced, and the entry it saved', async () => {
    jest
      .spyOn(superPersistEntry, 'persistEntry')
      .mockResolvedValue({ sha: 'sha-1', branch: 'main', url: 'https://github.example' });

    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts' });

    expect(backend.lastSavedCommit).toEqual({ sha: 'sha-1', entryPath: 'content/post.md' });
  });

  // Only the one-call commit endpoint returns a sha. Keeping the previous
  // one would make a fallback save watch the deploy of the save before it.
  it('forgets the commit when a save returns no sha', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue({ sha: 'sha-1' });
    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts' });

    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post');
    await backend.persistEntry(entry, { collectionName: 'posts' });

    expect(backend.lastSavedCommit).toBeNull();
  });

  // An editorial-workflow save commits to the entry's own `cms/...` branch,
  // and that commit never appears in a deploy of the site's branch — so
  // watching it would leave the editor waiting on a deploy that is never
  // coming.
  it('does not watch a commit made on an editorial-workflow branch', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue({
      sha: 'sha-wf',
      branch: 'cms/posts/post',
      url: 'https://github.example',
    });

    const backend = makeBackend();
    await backend.persistEntry(entry, { collectionName: 'posts', useWorkflow: true });

    expect(backend.lastSavedCommit).toBeNull();
    expect(backend.recordSaveForDeployWatch('A post')).toBe(false);
  });

  it('declines to record a save when none has produced a commit', () => {
    expect(makeBackend().recordSaveForDeployWatch('A post')).toBe(false);
  });

  it('declines to record when the backend has no Supabase project to read', () => {
    const backend = makeBackend();
    backend.baseUrl = undefined;
    backend.supabaseId = '';
    backend.lastSavedCommit = { sha: 'sha-1', entryPath: 'content/post.md' };

    expect(backend.recordSaveForDeployWatch('A post')).toBe(false);
  });

  it('records the save and announces it live when a deploy carries it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([deploymentRow('success')])),
    });

    const backend = makeBackend();
    backend.lastSavedCommit = { sha: 'sha-1', entryPath: 'content/post.md' };
    const resolutions = [];
    backend.subscribeDeployResolutions(resolution => resolutions.push(resolution));

    expect(backend.recordSaveForDeployWatch('A post')).toBe(true);
    await flush();

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('https://sb.example.com/rest/v1/site_deployments?');
    expect(url).toContain('site_id=eq.site-id');
    expect(url).toContain('branch=eq.');
    expect(init.headers.Authorization).toBe('Bearer access-token');

    expect(resolutions).toEqual([
      expect.objectContaining({
        status: 'live',
        entries: [{ entryPath: 'content/post.md', entryLabel: 'A post' }],
        targetUrl: 'https://site.example',
      }),
    ]);
  });

  // Ancestry is asked of git, not of two clocks — see §A4b.
  it('answers "is my change in this deploy" with GitHub compare', async () => {
    const backend = makeBackend();
    backend.ghFetch = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({ status: 'ahead' }) });

    await expect(backend.isCommitContained('mine', 'theirs')).resolves.toBe(true);
    expect(backend.ghFetch.mock.calls[0][0]).toContain('/compare/mine...theirs');

    backend.ghFetch.mockResolvedValue({ json: () => Promise.resolve({ status: 'identical' }) });
    await expect(backend.isCommitContained('mine', 'mine')).resolves.toBe(true);

    backend.ghFetch.mockResolvedValue({ json: () => Promise.resolve({ status: 'behind' }) });
    await expect(backend.isCommitContained('mine', 'older')).resolves.toBe(false);

    backend.ghFetch.mockResolvedValue({ json: () => Promise.resolve({ status: 'diverged' }) });
    await expect(backend.isCommitContained('mine', 'other-branch')).resolves.toBe(false);
  });
});

describe('turbo backend deploy status config', () => {
  // Core has no idea what a Turbo site is; the branch has to travel with the
  // options, or the Deploys page cannot tell "Live" from "a branch also built".
  it('reports the branch the site publishes from', () => {
    const backend = new DecapTurboGitHubBackend({
      backend: {
        repo: 'owner/repo',
        branch: 'turbo',
        supabase_app_id: 'supabase-project-id',
        supabase_anon_key: 'supabase-anon-key',
      },
      media_folder: 'static/media',
    });

    expect(backend.deployStatusConfig()).toMatchObject({
      enabled: true,
      page: true,
      branch: 'turbo',
    });
  });

  it('reports the default branch when the config names none', () => {
    const backend = new DecapTurboGitHubBackend({
      backend: {
        repo: 'owner/repo',
        supabase_app_id: 'supabase-project-id',
        supabase_anon_key: 'supabase-anon-key',
      },
      media_folder: 'static/media',
    });

    expect(backend.deployStatusConfig().branch).toBe('master');
  });
});

describe('turbo backend logout', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  function loggedInBackend() {
    const backend = new DecapTurboGitHubBackend(config);
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

    backend.logout();

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

    backend.logout();

    expect((await backend.status()).auth.status).toBe(false);
  });

  it('stops and drops the deploy watcher', () => {
    const backend = loggedInBackend();
    const stop = jest.fn();
    backend.deployWatcherInstance = { stop };

    backend.logout();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(backend.deployWatcherInstance).toBeNull();
  });
});

describe('turbo backend user identity', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  it('reports the signed-in Turbo user, not the repo owner', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.supabaseIdentity = {
      user_email: 'editor@example.com',
      user_metadata: { full_name: 'Ed Editor', avatar_url: 'https://cdn.example.com/ed.png' },
    };

    const user = await backend.currentUser({ token: 'token' });

    expect(user.name).toBe('Ed Editor');
    expect(user.email).toBe('editor@example.com');
    expect(user.avatar_url).toBe('https://cdn.example.com/ed.png');
    // `login` stays the repo owner: other GitHub code paths use it as an
    // identifier, not as a display name.
    expect(user.login).toBe('owner');
  });

  it('falls back to the email local part and no avatar when the account has neither', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.supabaseIdentity = { user_email: 'editor@example.com' };

    const user = await backend.currentUser({ token: 'token' });

    expect(user.name).toBe('editor');
    expect(user.avatar_url).toBeNull();
  });

  it('falls back to the repo owner when no session identity is known', async () => {
    const backend = new DecapTurboGitHubBackend(config);

    const user = await backend.currentUser({ token: 'token' });

    expect(user.name).toBe('owner');
    expect(user.email).toBeUndefined();
  });
});

describe('turbo backend locale sibling prefetch', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      supabase_app_id: 'supabase-project-id',
      supabase_anon_key: 'supabase-anon-key',
    },
    media_folder: 'static/media',
  };

  function makeBackend() {
    const backend = new DecapTurboGitHubBackend(config);
    backend.baseUrl = 'https://sb.example.com';
    backend.supabaseAccessToken = 'access-token';
    backend.siteId = 'site-id';
    // The listing's own sync and read, stubbed: these tests are about the
    // EXTRA sync the prefetch does, not about how a collection loads.
    backend.supabase = { fetchEntries: jest.fn().mockResolvedValue([]) };
    return backend;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const listingRegex = /\.en\..*/;
  const siblingRegex = /\.(?:de|si)\..*/;

  it('syncs the locale siblings under their own collection key', async () => {
    const backend = makeBackend();
    const sync = jest.spyOn(backend, 'syncCollection').mockResolvedValue({ fresh: true });

    await backend.allEntriesByFolder(
      'content/posts',
      'md',
      1,
      listingRegex,
      undefined,
      siblingRegex,
    );

    const collections = sync.mock.calls.map(call => call[0]);
    const regexes = sync.mock.calls.map(call => call[4]);

    // Two syncs, and crucially two DIFFERENT collection keys: the sibling rows
    // must not be tagged with the listing's key, or fetchEntries would return
    // three rows per entry and the collection would render each locale as its
    // own card.
    expect(sync).toHaveBeenCalledTimes(2);
    expect(new Set(collections).size).toBe(2);
    expect(regexes).toContain(siblingRegex);
    expect(collections.some(name => name.includes(siblingRegex.toString()))).toBe(true);
  });

  it('does not sync siblings when the collection has none', async () => {
    const backend = makeBackend();
    const sync = jest.spyOn(backend, 'syncCollection').mockResolvedValue({ fresh: true });

    await backend.allEntriesByFolder('content/posts', 'md', 1, listingRegex);

    expect(sync).toHaveBeenCalledTimes(1);
  });

  it('does not let a failed prefetch fail the collection load', async () => {
    // The prefetch is not awaited, so a rejection here would otherwise surface
    // as an unhandled rejection rather than as a slower entry open.
    const backend = makeBackend();
    jest.spyOn(backend, 'syncCollection').mockImplementation(collection =>
      collection.includes(siblingRegex.toString())
        ? Promise.reject(new Error('sibling sync failed'))
        : Promise.resolve({ fresh: true }),
    );

    await expect(
      backend.allEntriesByFolder('content/posts', 'md', 1, listingRegex, undefined, siblingRegex),
    ).resolves.toEqual([]);
  });
});
