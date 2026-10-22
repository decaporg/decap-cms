import DecapTurboGitHubBackend from '../implementation';
import TurboAPI from '../API';

const config = {
  backend: {
    repo: 'owner/repo',
    supabase_app_id: 'supabase-project-id',
    supabase_anon_key: 'supabase-anon-key',
  },
  media_folder: 'static/media',
};

const siteConfig = {
  backend: {
    ...config.backend,
    // Always present in practice: `preloadConfig` takes repo and branch from
    // the authoritative `sites` row, so `isBranchConfigured` is true and the
    // default-branch lookup never runs.
    branch: 'main',
    api_root: 'https://supabase.example/functions/v1/gh',
    turbo_site_id: 'site-123',
  },
  media_folder: 'static/media',
};

function telemetryEvents() {
  return global.fetch.mock.calls
    .filter(([url]) => String(url).includes('/functions/v1/telemetry'))
    .map(([, init]) => JSON.parse(init.body));
}

function withSession(backend) {
  backend.session.accessToken = 'old-token';
  backend.session.refreshToken = 'refresh-token';
  backend.session.expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return backend;
}

function reply(status, body) {
  const response = {
    ok: status < 400,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  };
  response.clone = () => ({ ...response });
  return response;
}

describe('turbo github backend session wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not logout on non-terminal refresh failure in currentUser', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    backend.session.getRefreshedAccessToken = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('network down'), { isTerminal: false }));
    backend.logout = jest.fn();

    const user = await backend.currentUser({ token: 'token' });

    expect(user.login).toBe('owner');
    expect(backend.logout).not.toHaveBeenCalled();
  });

  it('logs out on terminal refresh failure in currentUser', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    backend.session.getRefreshedAccessToken = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('invalid refresh token'), { isTerminal: true }));
    backend.logout = jest.fn();

    await expect(backend.currentUser({ token: 'token' })).rejects.toThrow(
      'Session expired. Please log in again.',
    );
    expect(backend.logout).toHaveBeenCalledTimes(1);
  });

  it('scopes gh proxy requests with auth header, x-site-id, and site_id query param', async () => {
    const backend = new DecapTurboGitHubBackend(siteConfig);
    backend.session.accessToken = 'access-123';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await backend.ghFetch('https://supabase.example/functions/v1/gh/repos/owner/repo');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://supabase.example/functions/v1/gh/repos/owner/repo?site_id=site-123');
    expect(init.headers.Authorization).toBe('Bearer access-123');
    expect(init.headers['x-site-id']).toBe('site-123');
  });

  it('repoints the API client, the cache client and the memoised user at a refreshed token', async () => {
    const backend = withSession(new DecapTurboGitHubBackend(config));
    backend.api = { token: 'old-token' };
    await backend.currentUser({ token: 'old-token' });

    backend.session.useSessionTokens({
      access_token: 'new-token',
      refresh_token: 'refresh-2',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(backend.token).toBe('new-token');
    expect(backend.api.token).toBe('new-token');
    expect(backend.supabase.supabaseAccessToken).toBe('new-token');
    expect(backend._currentUserPromise).toBeUndefined();
  });
});

describe('turbo github backend API funnel', () => {
  function backendWithApi(options = {}) {
    const backend = withSession(new DecapTurboGitHubBackend(siteConfig, options));
    backend.api = new TurboAPI({
      token: 'old-token',
      tokenKeyword: 'Bearer',
      branch: 'main',
      repo: 'owner/repo',
      originRepo: 'owner/repo',
      apiRoot: backend.apiRoot,
      turboFetch: backend.ghFetch,
    });
    backend.setScopedApiRequestBuilder();
    return backend;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes every GitHub API request to the site', async () => {
    const backend = backendWithApi();
    global.fetch = jest.fn().mockResolvedValue(reply(200, '{}'));

    await backend.api.request('/repos/owner/repo/issues');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain('site_id=site-123');
    expect(init.headers['x-site-id']).toBe('site-123');
    expect(init.headers.Authorization).toBe('Bearer old-token');
  });

  it('refreshes once on a proxy 401 and retries with the new token', async () => {
    const backend = backendWithApi();
    backend.session.getRefreshedAccessToken = jest.fn().mockImplementation(async () => {
      backend.session.accessToken = 'new-token';
      return 'new-token';
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ...reply(401, 'Unauthorized'), headers: new Headers() })
      .mockResolvedValueOnce(reply(200, '{}'));

    await backend.api.request('/repos/owner/repo/issues');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer new-token');
  });

  it('ends the session on a refusal reached through a GitHub API call', async () => {
    const onSessionInvalid = jest.fn();
    const backend = backendWithApi({ onSessionInvalid });
    const body = {
      error: 'This organization has no GitHub connection.',
      code: 'github_not_connected',
    };
    global.fetch = jest.fn().mockResolvedValue(reply(409, JSON.stringify(body)));

    await expect(backend.api.request('/repos/owner/repo/issues')).rejects.toMatchObject({
      status: 409,
    });
    await expect(backend.api.request('/repos/owner/repo/issues')).rejects.toThrow(body.error);

    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(onSessionInvalid).toHaveBeenCalledWith(body.error);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('turbo github backend authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ collections: {} }) });
  });

  it('does not read repo metadata, because Turbo commits as the App and never reads the answer', async () => {
    const backend = new DecapTurboGitHubBackend(siteConfig);
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
    expect(user.email).toBe('editor@example.com');
    expect(user.useOpenAuthoring).toBe(false);

    // GitHubBackend.authenticate would call hasWriteAccess() here, a
    // `GET /repos/{owner}/{repo}` whose result Turbo discards
    // (bypassWriteAccessCheckForAppTokens). It sat on the critical path of
    // every CMS load, so it must stay gone.
    const requested = global.fetch.mock.calls.map(([url]) => String(url));
    expect(requested.some(url => /\/repos\/owner\/repo(\?|$)/.test(url))).toBe(false);
    expect(requested.some(url => url.includes('/functions/v1/permissions'))).toBe(true);
  });

  it('builds the notes polling manager, which the base authenticate would have', async () => {
    // This override replaces GitHubBackend.authenticate wholesale, and that is
    // the only place the manager is built - without this, notes another editor
    // writes never reach the pane.
    const backend = new DecapTurboGitHubBackend(siteConfig);

    await backend.authenticate({ token: 'gh-token', access_token: 'access-123' });

    expect(backend.pollingManager).toBeDefined();
    await backend.logout();
    expect(backend.pollingManager).toBeUndefined();
  });

  it("replaces the previous session's manager rather than leaving it polling", async () => {
    const backend = new DecapTurboGitHubBackend(siteConfig);

    await backend.authenticate({ token: 'gh-token', access_token: 'access-123' });
    const first = backend.pollingManager;
    const destroy = jest.spyOn(first, 'destroy');

    await backend.authenticate({ token: 'gh-token-2', access_token: 'access-456' });

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(backend.pollingManager).not.toBe(first);
  });

  it('a new login clears the latch', async () => {
    const backend = withSession(new DecapTurboGitHubBackend(siteConfig));
    backend.session.invalidMessage = 'Session expired. Please log in again.';

    await backend.authenticate({ token: 't', access_token: 'fresh', refresh_token: 'r' });

    expect(backend.session.invalidMessage).toBeNull();
  });

  it('keeps whether the session is dedicated on the stored user, so a reload still knows', async () => {
    const credentials = {
      token: 'gh-token',
      access_token: 'access-123',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user_metadata: { active_site_id: 'site-123' },
    };

    const dedicated = new DecapTurboGitHubBackend(siteConfig);
    const dedicatedUser = await dedicated.authenticate({ ...credentials, dedicated_session: true });
    expect(dedicatedUser.dedicated_session).toBe(true);
    expect(dedicated.session.dedicated).toBe(true);

    const shared = new DecapTurboGitHubBackend(siteConfig);
    const sharedUser = await shared.authenticate(credentials);
    expect(sharedUser.dedicated_session).toBe(false);
  });

  it('fails for a user who is not a member of the site, before any event is recorded', async () => {
    const backend = new DecapTurboGitHubBackend(siteConfig);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(
      backend.authenticate({
        token: 'access-123',
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        user_metadata: { active_site_id: 'site-123' },
      }),
    ).rejects.toThrow("doesn't have access to this site");
    expect(telemetryEvents()).toEqual([]);
    expect(backend.session.accessToken).toBeNull();
  });
});

describe('turbo github backend config rejections', () => {
  // GraphQLAPI builds its own Apollo transport straight off the constructor
  // config and never goes through setScopedApiRequestBuilder's patched
  // urlFor/requestHeaders — so a GraphQL-mode site would silently bypass the
  // x-site-id/site_id tenant scoping the shared `gh` Edge Function relies on.
  it('throws in the constructor when use_graphql is set', () => {
    expect(
      () =>
        new DecapTurboGitHubBackend({
          ...config,
          backend: { ...config.backend, use_graphql: true },
        }),
    ).toThrow(/use_graphql/);
  });

  it('throws in the constructor when open_authoring is set', () => {
    expect(
      () =>
        new DecapTurboGitHubBackend({
          ...config,
          backend: { ...config.backend, open_authoring: true },
          publish_mode: 'editorial_workflow',
        }),
    ).toThrow(/open_authoring/);
  });
});

describe('turbo github backend delegations', () => {
  it('tells core that its search already covers entry bodies', () => {
    expect(new DecapTurboGitHubBackend(config).searchesEntryBody).toBe(true);
  });

  it('resolves its config as turbo-github', async () => {
    await expect(
      DecapTurboGitHubBackend.preloadConfig({ backend: { supabase_app_id: 'app-id' } }),
    ).rejects.toThrow(/^turbo-github config error/);
  });

  it('reads collections and entries through the content cache', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    const regex = /\.en\..*/;
    backend.cache.allEntriesByFolder = jest.fn().mockResolvedValue(['folder']);
    backend.cache.entriesByFiles = jest.fn().mockResolvedValue(['files']);
    backend.cache.getEntry = jest.fn().mockResolvedValue('entry');

    await expect(backend.allEntriesByFolder('posts', 'md', 1, regex, 'q', regex)).resolves.toEqual([
      'folder',
    ]);
    await expect(backend.entriesByFolder('posts', 'md', 2)).resolves.toEqual(['folder']);
    await expect(backend.entriesByFiles([{ path: 'a.md' }])).resolves.toEqual(['files']);
    await expect(backend.getEntry('a.md')).resolves.toBe('entry');

    expect(backend.cache.allEntriesByFolder.mock.calls).toEqual([
      ['posts', 'md', 1, regex, 'q', regex],
      ['posts', 'md', 2, undefined, undefined, undefined],
    ]);
    expect(backend.cache.entriesByFiles).toHaveBeenCalledWith([{ path: 'a.md' }]);
    expect(backend.cache.getEntry).toHaveBeenCalledWith('a.md', expect.any(Function));
  });

  it('builds the cache on the proxy with the speculative read', async () => {
    const backend = withSession(new DecapTurboGitHubBackend(siteConfig));
    global.fetch = jest.fn().mockResolvedValue(reply(200, '{"fresh":true}'));
    backend.supabase.fetchEntries = jest.fn().mockResolvedValue([]);

    await backend.allEntriesByFolder('posts', 'md', 1);

    expect(global.fetch.mock.calls[0][0]).toBe(
      'https://supabase.example/functions/v1/gh/_content/sync?site_id=site-123',
    );
    expect(backend.supabase.fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('hands out the session token, refreshed first', async () => {
    const backend = withSession(new DecapTurboGitHubBackend(config));
    backend.session.refreshIfNeeded = jest.fn().mockResolvedValue(undefined);

    await expect(backend.getToken()).resolves.toBe('old-token');
    expect(backend.session.refreshIfNeeded).toHaveBeenCalledTimes(1);
  });

  it('adopts the stored tokens before authenticating a restored user', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.authenticate = jest.fn().mockResolvedValue('user');
    const user = { token: 't', access_token: 'a', refresh_token: 'r', expires_at: 1 };

    await expect(backend.restoreUser(user)).resolves.toBe('user');

    expect(backend.session.accessToken).toBe('a');
    expect(backend.session.refreshToken).toBe('r');
    expect(backend.authenticate).toHaveBeenCalledWith(user);
  });

  it('starts the editor bridge when the site sets editor_bridge: true', () => {
    const backend = new DecapTurboGitHubBackend({
      ...siteConfig,
      backend: { ...siteConfig.backend, editor_bridge: true },
    });
    const editor = {
      getCurrentEntry: jest.fn(() => null),
      applyFieldPatch: jest.fn(() => ({ applied: [], rejected: [] })),
      onEditorChange: jest.fn(() => () => {}),
    };
    const registerFieldAction = jest.fn();

    backend.attachEditor({ editor, registerFieldAction });

    expect(backend.editorBridgeInstance).not.toBeNull();
    expect(registerFieldAction).toHaveBeenCalledTimes(1);
    backend.editorBridgeInstance.stop();
  });
});

describe('turbo github backend persistEntry', () => {
  // super.persistEntry — the real one drives the GitHub API client, which this
  // suite has no business standing up.
  const superPersistEntry = Object.getPrototypeOf(DecapTurboGitHubBackend.prototype);

  const entry = {
    dataFiles: [{ slug: 'post', path: 'content/post.md', raw: 'hello' }],
    assets: [],
  };

  function makeBackend() {
    const backend = new DecapTurboGitHubBackend({
      ...config,
      backend: { ...config.backend, branch: 'turbo' },
    });
    backend.baseUrl = 'https://sb.example.com';
    backend.session.accessToken = 'access-token';
    backend.siteId = 'site-id';
    return backend;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records the save against the site branch', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post');
    const backend = makeBackend();

    await expect(backend.persistEntry(entry, { collectionName: 'posts' })).resolves.toBe('post');

    expect(telemetryEvents()).toEqual([
      expect.objectContaining({
        event_name: 'cms_entry_saved',
        site_id: 'site-id',
        props: expect.objectContaining({ branch: 'turbo', workflow: false, requests: 0 }),
      }),
    ]);
    expect(backend.proxyMeter).toBeNull();
  });

  it('prefers the branch the one-call commit endpoint reports', async () => {
    jest
      .spyOn(superPersistEntry, 'persistEntry')
      .mockResolvedValue({ sha: 'abc123', branch: 'cms/posts/post' });
    const backend = makeBackend();

    await backend.persistEntry(entry, { collectionName: 'posts', useWorkflow: true });

    expect(telemetryEvents()[0].props.branch).toBe('cms/posts/post');
  });

  it('names the workflow branch the way the API client does', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post');
    const backend = makeBackend();
    backend.api = { generateContentKey: jest.fn().mockReturnValue('posts/post') };

    await backend.persistEntry(entry, { collectionName: 'posts', useWorkflow: true });

    expect(backend.api.generateContentKey).toHaveBeenCalledWith('posts', 'post');
    expect(telemetryEvents()[0].props).toMatchObject({ branch: 'cms/posts/post', workflow: true });
  });
});

// Which commit the save toast watches, and when there is nothing to watch.
describe('turbo github backend deploy watch', () => {
  const superPersistEntry = Object.getPrototypeOf(DecapTurboGitHubBackend.prototype);

  const entry = {
    dataFiles: [{ slug: 'post', path: 'content/post.md', raw: 'hello' }],
    assets: [],
  };

  function makeBackend() {
    // `branch` is load-bearing here: only a commit on the site's own branch can
    // produce a deploy the editor is waiting for.
    const backend = new DecapTurboGitHubBackend({
      ...config,
      backend: { ...config.backend, branch: 'main' },
    });
    backend.baseUrl = 'https://sb.example.com';
    backend.session.accessToken = 'access-token';
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
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
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

  // Ancestry is asked of git, not of two clocks.
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

describe('turbo github backend deploy status config', () => {
  // Core has no idea what a Turbo site is; the branch has to travel with the
  // options, or the Deploys page cannot tell "Live" from "a branch also built".
  it('reports the branch the site publishes from', () => {
    const backend = new DecapTurboGitHubBackend({
      ...config,
      backend: { ...config.backend, branch: 'turbo' },
    });

    expect(backend.deployStatusConfig()).toMatchObject({
      enabled: true,
      page: true,
      branch: 'turbo',
    });
  });

  it('reports the default branch when the config names none', () => {
    expect(new DecapTurboGitHubBackend(config).deployStatusConfig().branch).toBe('master');
  });
});

describe('turbo github backend logout', () => {
  function loggedInBackend() {
    const backend = withSession(new DecapTurboGitHubBackend(config));
    backend.session.identity = { user_email: 'editor@example.com' };
    backend.supabase.setAccessToken('old-token');
    return backend;
  }

  it('clears the Supabase session the auth store does not know about', async () => {
    const backend = loggedInBackend();
    await backend.currentUser({ token: 'old-token' });
    expect((await backend.status()).auth.status).toBe(true);

    backend.logout();

    expect(backend.session.accessToken).toBeNull();
    expect(backend.session.identity).toBeNull();
    expect(backend.supabase.supabaseAccessToken).toBeNull();
    expect(backend._currentUserPromise).toBeUndefined();
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

describe('turbo github backend user identity', () => {
  it('reports the signed-in Turbo user, not the repo owner', async () => {
    const backend = new DecapTurboGitHubBackend(config);
    backend.session.identity = {
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

  it('falls back to the repo owner when no session identity is known', async () => {
    const user = await new DecapTurboGitHubBackend(config).currentUser({ token: 'token' });

    expect(user.name).toBe('owner');
    expect(user.email).toBeUndefined();
    expect(user.avatar_url).toBeNull();
  });
});

describe('turbo github backend notes', () => {
  const USER_ID = '3f2b1c4d-0000-4a5b-8c9d-1e2f3a4b5c6d';

  function segment(value) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  }

  function signedIn() {
    const backend = new DecapTurboGitHubBackend(config);
    backend.session.accessToken = `${segment({ alg: 'HS256' })}.${segment({ sub: USER_ID })}.sig`;
    backend.session.identity = {
      user_email: 'decap@p-m.si',
      user_metadata: { full_name: 'Decap Tester' },
    };
    return backend;
  }

  it('attributes a note to the editor, not to the repo owner', async () => {
    // Every note is posted by the App installation, so the comment's account
    // is the same bot for everyone and `currentUser().login` - what the GitHub
    // backend compares on - is the repo owner for every editor alike.
    const backend = signedIn();

    expect(await backend.noteAuthorIdentity()).toEqual({
      author: 'Decap Tester',
      authorId: USER_ID,
    });
    expect((await backend.currentUser({ token: 't' })).login).toBe('owner');
  });

  it('leaves a new note without an avatar, as a re-read of it would be', async () => {
    // The thread only carries the App's avatar, so a note read back from the
    // host shows initials. Showing the editor's own avatar until the next read
    // would make the same note look like two different ones.
    const backend = signedIn();
    backend.api = {
      addNoteToEntry: jest
        .fn()
        .mockResolvedValue({ commentId: '99', issueUrl: 'https://github.com/o/r/issues/1' }),
    };

    const note = await backend.addNote('posts', 'my-post', { content: 'hi' }, 'My post');

    expect(note).toEqual(
      expect.objectContaining({ id: '99', author: 'Decap Tester', authorId: USER_ID }),
    );
    expect(note.avatarUrl).toBeUndefined();
  });
});
