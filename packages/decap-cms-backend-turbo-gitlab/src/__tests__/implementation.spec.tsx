import { unsentRequest } from 'decap-cms-lib-util';
import { API } from 'decap-cms-backend-gitlab';

import DecapTurboGitLabBackend from '../implementation';

// Loosely typed on purpose — these are minimal fixtures, not full Config
// objects.
const config: any = {
  backend: {
    repo: 'group/project',
    supabase_app_id: 'supabase-project-id',
    supabase_anon_key: 'supabase-anon-key',
  },
  media_folder: 'static/media',
};

const siteConfig: any = {
  backend: {
    ...config.backend,
    branch: 'main',
    api_root: 'https://supabase.example/functions/v1/gl',
    turbo_site_id: 'site-123',
  },
  media_folder: 'static/media',
};

const treeUrl = 'https://supabase.example/functions/v1/gl/projects/group%2Fproject/repository/tree';

function telemetryEvents() {
  return (global.fetch as jest.Mock).mock.calls
    .filter(([url]) => String(url).includes('/functions/v1/telemetry'))
    .map(([, init]) => JSON.parse(init.body));
}

function withSession(backend: any) {
  backend.session.accessToken = 'old-token';
  backend.session.refreshToken = 'refresh-token';
  backend.session.expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return backend;
}

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

describe('turbo gitlab backend session wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not logout on non-terminal refresh failure in currentUser', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    backend.session.getRefreshedAccessToken = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('network down'), { isTerminal: false }));
    backend.logout = jest.fn();

    const user = await backend.currentUser({ token: 'token' });

    expect(user.username).toBe('group');
    expect(backend.logout).not.toHaveBeenCalled();
  });

  it('logs out on terminal refresh failure in currentUser', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
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

  it('scopes gl proxy requests with auth header, x-site-id header, and site_id query param', async () => {
    const backend: any = new DecapTurboGitLabBackend(siteConfig);
    backend.session.accessToken = 'access-123';
    global.fetch = jest.fn().mockResolvedValue(ok());

    // apiRequestFunction expects an Immutable-style ApiRequest — build a real
    // one via unsentRequest.fromURL rather than a hand-rolled fake, so this
    // test exercises the actual header/param shape sent.
    await backend.apiRequestFunction(unsentRequest.fromURL(treeUrl));
    await backend.glFetch('https://supabase.example/functions/v1/gl/_content/sync', {
      method: 'POST',
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    for (const [url, init] of (global.fetch as jest.Mock).mock.calls) {
      expect(url).toContain('site_id=site-123');
      expect(init.headers.Authorization).toBe('Bearer access-123');
      expect(init.headers['x-site-id']).toBe('site-123');
    }
  });

  it('repoints the API client, the cache client and the memoised user at a refreshed token', async () => {
    const backend: any = withSession(new DecapTurboGitLabBackend(config));
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

describe('turbo gitlab backend apiRequestFunction', () => {
  function backendWithSession(options = {}) {
    return withSession(new DecapTurboGitLabBackend(siteConfig, options));
  }

  function apiFor(backend: any) {
    return new API({
      token: 'old-token',
      branch: 'main',
      repo: 'group/project',
      apiRoot: siteConfig.backend.api_root,
      requestFunction: backend.apiRequestFunction,
    } as any);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes once on a proxy 401 and retries with the new token', async () => {
    const backend = backendWithSession();
    backend.session.getRefreshedAccessToken = jest.fn().mockImplementation(async () => {
      backend.session.accessToken = 'new-token';
      return 'new-token';
    });
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
    backend.session.getRefreshedAccessToken = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('refresh_token_not_found'), { isTerminal: true }));
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
    expect(backend.session.accessToken).toBeNull();
  });

  it('ends the session on a refusal reached through a GitLab API call', async () => {
    const onSessionInvalid = jest.fn();
    const backend = backendWithSession({ onSessionInvalid });
    const body = {
      error: 'This organization has no GitLab connection.',
      code: 'gitlab_not_connected',
    };
    global.fetch = jest
      .fn()
      .mockResolvedValue(reply(409, JSON.stringify(body), 'application/json'));

    const response = await backend.apiRequestFunction(unsentRequest.fromURL(treeUrl));

    expect(response.status).toBe(409);
    expect(onSessionInvalid).toHaveBeenCalledWith(body.error);
  });

  it('fails a GitLab API call at once with the reason, without backing off', async () => {
    // lib-util's requestWithBackoff retries a throw five times with growing
    // pauses; a latched session must not throw into it.
    const backend = backendWithSession();
    backend.session.invalidMessage = 'Session expired. Please log in again.';
    global.fetch = jest.fn();
    const api = apiFor(backend);

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

    await expect(apiFor(backend).requestJSON('/user')).rejects.toMatchObject({
      status: 403,
      message: 'This site is read-only',
    });
  });
});

describe('turbo gitlab backend authenticate', () => {
  function ready(backend: any) {
    backend.session.fetchPermissions = jest.fn().mockResolvedValue(undefined);
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const target = String(url);
      if (target.includes('/user')) {
        return Promise.resolve(
          reply(
            200,
            JSON.stringify({ id: 1, username: 'decap', name: 'Decap Tester' }),
            'application/json',
          ),
        );
      }
      // hasWriteAccess reads the project and looks at its permissions.
      return Promise.resolve(
        reply(
          200,
          JSON.stringify({ permissions: { project_access: { access_level: 40 } }, id: 7 }),
          'application/json',
        ),
      );
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
    const backend: any = ready(new DecapTurboGitLabBackend(siteConfig));

    const user = await backend.authenticate({
      token: 'gl-token',
      access_token: 'access-123',
      user_email: 'ed@example.com',
      user_metadata: { active_site_id: 'site-123', full_name: 'Ed Editor' },
    });

    expect(backend.notesApi).toBeDefined();
    expect(backend.pollingManager).toBeDefined();
    expect(user).toMatchObject({ login: 'decap', name: 'Ed Editor', access_token: 'access-123' });

    await backend.logout();
    expect(backend.pollingManager).toBeUndefined();
  });

  it('a new login clears the latch', async () => {
    const backend: any = ready(new DecapTurboGitLabBackend(siteConfig));
    backend.session.invalidMessage = 'Session expired. Please log in again.';

    await backend.authenticate({ token: 'gl-token', access_token: 'access-123' });

    expect(backend.session.invalidMessage).toBeNull();
  });

  it("replaces the previous session's manager rather than leaving it polling", async () => {
    const backend: any = ready(new DecapTurboGitLabBackend(siteConfig));

    await backend.authenticate({ token: 'gl-token', access_token: 'access-123' });
    const first = backend.pollingManager;
    const destroy = jest.spyOn(first, 'destroy');

    await backend.authenticate({ token: 'gl-token-2', access_token: 'access-456' });

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(backend.pollingManager).not.toBe(first);
    expect(backend.notesApi).toBeDefined();
  });

  it('refuses a group token that cannot write to the project', async () => {
    const backend: any = ready(new DecapTurboGitLabBackend(siteConfig));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const body = String(url).includes('/user')
        ? { id: 1, username: 'decap', name: 'Decap Tester' }
        : { permissions: { project_access: { access_level: 10 }, group_access: null }, id: 7 };
      return Promise.resolve(reply(200, JSON.stringify(body), 'application/json'));
    }) as any;

    await expect(
      backend.authenticate({ token: 'gl-token', access_token: 'access-123' }),
    ).rejects.toThrow('does not have write access');
  });
});

describe('turbo gitlab backend config rejections', () => {
  // GitLab's own GraphQL client also builds its transport independently of
  // apiRequestFunction, so it would bypass the x-site-id/site_id tenant
  // scoping the shared `gl` Edge Function relies on.
  it('throws in the constructor when use_graphql is set', () => {
    expect(
      () =>
        new DecapTurboGitLabBackend({
          ...config,
          backend: { ...config.backend, use_graphql: true },
        }),
    ).toThrow(/use_graphql/);
  });

  it('throws in the constructor when open_authoring is set', () => {
    expect(
      () =>
        new DecapTurboGitLabBackend({
          ...config,
          backend: { ...config.backend, open_authoring: true },
          publish_mode: 'editorial_workflow',
        }),
    ).toThrow(/open_authoring/);
  });
});

describe('turbo gitlab backend delegations', () => {
  it('tells core that its search already covers entry bodies', () => {
    expect(new DecapTurboGitLabBackend(config).searchesEntryBody).toBe(true);
  });

  it('resolves its config as turbo-gitlab', async () => {
    await expect(
      DecapTurboGitLabBackend.preloadConfig({ backend: { supabase_app_id: 'app-id' } } as any),
    ).rejects.toThrow(/^turbo-gitlab config error/);
  });

  it('reads collections and entries through the content cache', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
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

  it('builds the cache on the proxy, reading once after the sync', async () => {
    const backend: any = withSession(new DecapTurboGitLabBackend(siteConfig));
    global.fetch = jest.fn().mockResolvedValue(reply(200, '{"fresh":true}', 'application/json'));
    backend.supabase.fetchEntries = jest.fn().mockResolvedValue([]);

    await backend.allEntriesByFolder('posts', 'md', 1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'https://supabase.example/functions/v1/gl/_content/sync?site_id=site-123',
    );
    expect(backend.supabase.fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('hands out the session token, refreshed first', async () => {
    const backend: any = withSession(new DecapTurboGitLabBackend(config));
    backend.session.refreshIfNeeded = jest.fn().mockResolvedValue(undefined);

    await expect(backend.getToken()).resolves.toBe('old-token');
    expect(backend.session.refreshIfNeeded).toHaveBeenCalledTimes(1);
  });

  it('adopts the stored tokens before authenticating a restored user', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.authenticate = jest.fn().mockResolvedValue('user');
    const user = { token: 't', access_token: 'a', refresh_token: 'r', expires_at: 1 };

    await expect(backend.restoreUser(user)).resolves.toBe('user');

    expect(backend.session.accessToken).toBe('a');
    expect(backend.session.refreshToken).toBe('r');
    expect(backend.authenticate).toHaveBeenCalledWith(user);
  });

  it('starts the editor bridge when the site sets editor_bridge: true', () => {
    const backend = new DecapTurboGitLabBackend({
      ...siteConfig,
      backend: { ...siteConfig.backend, editor_bridge: true },
    });
    const editor = {
      getCurrentEntry: jest.fn(() => null),
      applyFieldPatch: jest.fn(() => ({ applied: [], rejected: [] })),
      onEditorChange: jest.fn(() => () => undefined),
    };
    const registerFieldAction = jest.fn();

    backend.attachEditor({ editor, registerFieldAction } as any);

    expect(backend.editorBridgeInstance).not.toBeNull();
    expect(registerFieldAction).toHaveBeenCalledTimes(1);
    backend.editorBridgeInstance!.stop();
  });
});

describe('turbo gitlab backend persistEntry', () => {
  // super.persistEntry — the real one drives the GitLab API client, which this
  // suite has no business standing up.
  const superPersistEntry = Object.getPrototypeOf(DecapTurboGitLabBackend.prototype);

  const entry = {
    dataFiles: [{ slug: 'post', path: 'content/post.md', raw: 'hello' }],
    assets: [],
  };

  function makeBackend() {
    const backend: any = new DecapTurboGitLabBackend({
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
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records the save against the site branch', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post' as any);
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

  it('records an editorial-workflow save against its own branch', async () => {
    jest.spyOn(superPersistEntry, 'persistEntry').mockResolvedValue('post' as any);
    const backend = makeBackend();

    await backend.persistEntry(entry, { collectionName: 'posts', useWorkflow: true });

    expect(telemetryEvents()[0].props).toMatchObject({ branch: 'cms/posts/post', workflow: true });
  });
});

describe('turbo gitlab backend logout', () => {
  it('clears the Supabase session the auth store does not know about', async () => {
    const backend: any = withSession(new DecapTurboGitLabBackend(config));
    backend.session.identity = { user_email: 'editor@example.com' };
    backend.supabase.setAccessToken('old-token');
    await backend.currentUser({ token: 'old-token' });
    expect((await backend.status()).auth.status).toBe(true);

    await backend.logout();

    expect(backend.session.accessToken).toBeNull();
    expect(backend.session.identity).toBeNull();
    expect(backend.supabase.supabaseAccessToken).toBeNull();
    expect(backend._currentUserPromise).toBeUndefined();
    expect(backend.token).toBeNull();
    expect((await backend.status()).auth.status).toBe(false);
  });
});

describe('turbo gitlab backend user identity', () => {
  it('reports the signed-in Turbo user, not the project owner', async () => {
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.session.identity = {
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
    const user = await new DecapTurboGitLabBackend(config).currentUser({ token: 'token' });

    expect(user.name).toBe('group');
    expect(user.email).toBeUndefined();
    expect(user.avatar_url).toBeNull();
  });
});

describe('turbo gitlab backend notes', () => {
  const USER_ID = '3f2b1c4d-0000-4a5b-8c9d-1e2f3a4b5c6d';

  function segment(value: unknown) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  }

  it('attributes a note to the editor without asking the proxy who they are', async () => {
    // GitLabBackend reads the username off `api.user()`, which here is the
    // proxy's synthesized answer built from the email's local part - a round
    // trip, a name nobody recognises, and a value two editors can share.
    const backend: any = new DecapTurboGitLabBackend(config);
    backend.session.accessToken = `${segment({ alg: 'HS256' })}.${segment({ sub: USER_ID })}.sig`;
    backend.session.identity = {
      user_email: 'decap@p-m.si',
      user_metadata: { full_name: 'Decap Tester' },
    };
    backend.api = { user: jest.fn() };

    expect(await backend.noteAuthorIdentity()).toEqual({
      author: 'Decap Tester',
      authorId: USER_ID,
    });
    expect(backend.api.user).not.toHaveBeenCalled();
  });
});
