import { APIError } from 'decap-cms-lib-util';

import { SESSION_EXPIRED_MESSAGE, TurboSession } from '../session';

import type { TurboSessionOptions } from '../session';

function makeSession(options: Partial<TurboSessionOptions> = {}) {
  return new TurboSession({
    supabaseId: 'supabase-project-id',
    anonKey: 'supabase-anon-key',
    siteId: '',
    ...options,
  });
}

function inAnHour() {
  return Math.floor(Date.now() / 1000) + 3600;
}

function refreshResponse(tokens: Partial<Record<string, unknown>> = {}) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: inAnHour(),
        ...tokens,
      }),
  };
}

describe('TurboSession refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries refresh for transient failures and updates credentials', async () => {
    const updateUserCredentials = jest.fn();
    const session = makeSession({ updateUserCredentials });
    session.refreshToken = 'refresh-token';
    session.delay = jest.fn().mockResolvedValue(undefined);

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary network error'))
      .mockResolvedValueOnce(refreshResponse() as any);

    await expect(session.getRefreshedAccessToken()).resolves.toBe('new-access-token');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(updateUserCredentials).toHaveBeenCalledTimes(1);
    expect(session.accessToken).toBe('new-access-token');
    expect(session.refreshToken).toBe('new-refresh-token');
  });

  it('marks invalid_grant as terminal and avoids retries', async () => {
    const session = makeSession();
    session.refreshToken = 'refresh-token';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    } as any);

    await expect(session.getRefreshedAccessToken()).rejects.toMatchObject({ isTerminal: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('marks refresh_token_not_found as terminal, so a dead session cannot storm', async () => {
    // The code GoTrue returns for a rotated-away or expired refresh token;
    // retrying it would storm GoTrue until it rate-limits the session.
    const session = makeSession();
    session.refreshToken = 'rotated-away-token';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          code: 400,
          error_code: 'refresh_token_not_found',
          msg: 'Invalid Refresh Token: Refresh Token Not Found',
        }),
    } as any);

    await expect(session.getRefreshedAccessToken()).rejects.toMatchObject({ isTerminal: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('logs out once on a terminal refresh instead of letting callers reuse a dead token', async () => {
    const logout = jest.fn();
    const onSessionInvalid = jest.fn();
    const session = makeSession({ logout, onSessionInvalid });
    session.refreshToken = 'rotated-away-token';
    session.accessToken = 'expired-access-token';
    // Inside the refresh buffer, so refreshIfNeeded actually runs.
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error_code: 'refresh_token_not_found' }),
    } as any);

    await expect(session.refreshIfNeeded()).rejects.toThrow(/log in again/i);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(onSessionInvalid).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
    expect(session.invalidMessage).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('stops re-attempting a transiently failed refresh for a cooldown window', async () => {
    // A rate limit or a 5xx is not worth one three-attempt cycle per request:
    // refreshedTokenPromise only dedupes refreshes that overlap in flight, and
    // a collection load fires its entries sequentially.
    const session = makeSession();
    session.refreshToken = 'refresh-token';
    session.accessToken = 'expired-access-token';
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    session.delay = jest.fn().mockResolvedValue(undefined);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error_code: 'over_request_rate_limit' }),
    } as any);

    // Non-terminal: it must NOT log the user out.
    await expect(session.refreshIfNeeded()).resolves.toBeUndefined();
    const afterFirst = (global.fetch as jest.Mock).mock.calls.length;
    expect(afterFirst).toBe(3); // the three in-cycle attempts

    // Three more requests arriving right behind it add nothing.
    await session.refreshIfNeeded();
    await session.refreshIfNeeded();
    await session.refreshIfNeeded();
    expect(global.fetch).toHaveBeenCalledTimes(afterFirst);

    // Once the window passes, it is willing to try again.
    session.refreshBlockedUntil = 0;
    await session.refreshIfNeeded();
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(afterFirst);
  });

  it('reads a missing expires_at from the token, so the session still refreshes', async () => {
    const session = makeSession();
    const exp = Math.floor(Date.now() / 1000) + 10;
    session.accessToken = `header.${btoa(JSON.stringify({ exp }))}.signature`;
    session.refreshToken = 'refresh-token';
    session.getRefreshedAccessToken = jest.fn().mockResolvedValue('new-token');

    await session.refreshIfNeeded();

    expect(session.getRefreshedAccessToken).toHaveBeenCalledTimes(1);
  });

  it('tells the host about every token change, the clearing included', async () => {
    const onTokensChanged = jest.fn();
    const session = makeSession({ onTokensChanged });
    session.refreshToken = 'refresh-token';
    global.fetch = jest.fn().mockResolvedValue(refreshResponse() as any);

    await session.getRefreshedAccessToken();
    session.clear();

    expect(onTokensChanged.mock.calls).toEqual([['new-access-token'], [null]]);
  });
});

describe('TurboSession proxy answers', () => {
  function sessionWithTokens(options: Partial<TurboSessionOptions> = {}) {
    const session = makeSession({ siteId: 'site-123', ...options });
    session.accessToken = 'old-token';
    session.refreshToken = 'refresh-token';
    session.expiresAt = inAnHour();
    return session;
  }

  it('refreshes once on the proxy refusing the token and asks for a retry', async () => {
    const session = sessionWithTokens();
    session.getRefreshedAccessToken = jest.fn().mockResolvedValue('new-token');

    await expect(session.reactToProxyAuthAnswer(401, 'Unauthorized', false)).resolves.toBe('retry');
    expect(session.getRefreshedAccessToken).toHaveBeenCalledTimes(1);
  });

  it('ends the session when the retry is refused too', async () => {
    const onSessionInvalid = jest.fn();
    const session = sessionWithTokens({ onSessionInvalid });
    session.getRefreshedAccessToken = jest.fn();

    await expect(session.reactToProxyAuthAnswer(401, 'Unauthorized', true)).resolves.toBe('fail');

    expect(session.getRefreshedAccessToken).not.toHaveBeenCalled();
    expect(onSessionInvalid).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
  });

  it('ends the session when the refresh is refused for good', async () => {
    const logout = jest.fn();
    const onSessionInvalid = jest.fn();
    const session = sessionWithTokens({ logout, onSessionInvalid });
    const terminal = Object.assign(new Error('refresh_token_not_found'), { isTerminal: true });
    session.getRefreshedAccessToken = jest.fn().mockRejectedValue(terminal);

    await expect(session.reactToProxyAuthAnswer(401, 'Unauthorized', false)).resolves.toBe('fail');

    expect(logout).toHaveBeenCalledTimes(1);
    expect(onSessionInvalid).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
    expect(() => session.assertUsable()).toThrow(APIError);
  });

  it('does not log out over a git host 401 passed through the proxy', async () => {
    const onSessionInvalid = jest.fn();
    const session = sessionWithTokens({ onSessionInvalid });
    session.getRefreshedAccessToken = jest.fn();

    await expect(
      session.reactToProxyAuthAnswer(401, '{"message":"Bad credentials"}', false),
    ).resolves.toBe('fail');

    expect(session.getRefreshedAccessToken).not.toHaveBeenCalled();
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });

  it('ends the session on a 403 for a site the user lost access to', async () => {
    const onSessionInvalid = jest.fn();
    const session = sessionWithTokens({ onSessionInvalid });

    await session.reactToProxyAuthAnswer(
      403,
      '{"error":"Forbidden: no access to requested site"}',
      false,
    );

    expect(onSessionInvalid).toHaveBeenCalledWith(
      expect.stringContaining("doesn't have access to this site"),
    );
  });

  it('does not end the session over a refusal the editor can retry past', async () => {
    const onSessionInvalid = jest.fn();
    const session = sessionWithTokens({ onSessionInvalid });

    await session.reactToProxyAuthAnswer(
      403,
      '{"error":"Forbidden: x","code":"repo_mismatch"}',
      false,
    );

    expect(onSessionInvalid).not.toHaveBeenCalled();
    expect(session.invalidMessage).toBeNull();
  });

  describe('configuration refusals', () => {
    const scopeSentence =
      'Forbidden: repo "owner/repo" is not in this organization\'s selected repo scope. Add it.';
    const refusals: [string, number, Record<string, string>][] = [
      [
        'site_repo_missing',
        403,
        { error: 'Forbidden: site has no repo configured. Set it.', code: 'site_repo_missing' },
      ],
      ['repo_not_in_scope', 403, { error: scopeSentence, code: 'repo_not_in_scope' }],
      ['the repo-scope sentence without a code', 403, { error: scopeSentence }],
      [
        'github_not_connected',
        409,
        { error: 'This organization has no GitHub connection.', code: 'github_not_connected' },
      ],
      [
        'github_installation_missing',
        409,
        { error: 'The GitHub App is gone.', code: 'github_installation_missing' },
      ],
      [
        'github_installation_unavailable',
        409,
        { error: 'The GitHub App is suspended.', code: 'github_installation_unavailable' },
      ],
      [
        'gitlab_not_connected',
        409,
        { error: 'This organization has no GitLab connection.', code: 'gitlab_not_connected' },
      ],
    ];

    it.each(refusals)(
      'ends the session once with the server sentence on %s',
      async (_name, status, body) => {
        const onSessionInvalid = jest.fn();
        const session = sessionWithTokens({ onSessionInvalid });

        await expect(
          session.reactToProxyAuthAnswer(status, JSON.stringify(body), false),
        ).resolves.toBe('fail');
        await session.reactToProxyAuthAnswer(status, JSON.stringify(body), false);

        expect(onSessionInvalid).toHaveBeenCalledTimes(1);
        expect(onSessionInvalid).toHaveBeenCalledWith(body.error);
        expect(() => session.assertUsable()).toThrow(body.error);
      },
    );
  });

  it('ends the session through core when a proactive refresh is refused', async () => {
    const onSessionInvalid = jest.fn();
    const session = sessionWithTokens({ onSessionInvalid });
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    const terminal = Object.assign(new Error('refresh_token_not_found'), { isTerminal: true });
    session.getRefreshedAccessToken = jest.fn().mockRejectedValue(terminal);

    await expect(session.refreshIfNeeded()).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(session.invalidMessage).toBe(SESSION_EXPIRED_MESSAGE);
  });
});

describe('TurboSession login', () => {
  it('takes the tokens, the identity and the dedicated flag from the credentials', async () => {
    const onTokensChanged = jest.fn();
    const session = makeSession({ onTokensChanged });
    session.invalidMessage = SESSION_EXPIRED_MESSAGE;
    const expiresAt = inAnHour();

    await session.begin({
      token: 'access-123',
      access_token: 'access-123',
      refresh_token: 'refresh-123',
      expires_at: expiresAt,
      dedicated_session: true,
      user_email: 'editor@example.com',
    } as any);

    expect(session.invalidMessage).toBeNull();
    expect(session.accessToken).toBe('access-123');
    expect(session.refreshToken).toBe('refresh-123');
    expect(session.expiresAt).toBe(expiresAt);
    expect(session.dedicated).toBe(true);
    expect(session.identity).toMatchObject({ user_email: 'editor@example.com' });
    expect(onTokensChanged).toHaveBeenCalledWith('access-123');
  });

  it('writes the site into the session only when the JWT names another one', async () => {
    const session = makeSession({ siteId: 'site-123' });
    session.setActiveSiteAndRefresh = jest.fn().mockResolvedValue(undefined);

    await session.begin({
      token: 't',
      access_token: 'a',
      user_metadata: { active_site_id: 'site-123' },
    } as any);
    expect(session.setActiveSiteAndRefresh).not.toHaveBeenCalled();

    await session.begin({
      token: 't',
      access_token: 'a',
      user_metadata: { active_site_id: 'site-other' },
    } as any);
    expect(session.setActiveSiteAndRefresh).toHaveBeenCalledTimes(1);
  });

  it('keeps whether the session is dedicated on the stored user, so a reload still knows', async () => {
    const credentials = { token: 't', access_token: 'a', expires_at: inAnHour() } as any;

    const dedicated = makeSession();
    await dedicated.begin({ ...credentials, dedicated_session: true });
    expect(dedicated.storedUserFields(credentials).dedicated_session).toBe(true);

    const shared = makeSession();
    await shared.begin(credentials);
    expect(shared.storedUserFields(credentials).dedicated_session).toBe(false);
  });

  it('returns the stored fields with the permissions attached', () => {
    const session = makeSession();
    const permissions = { collections: { posts: 'view' } };

    expect(
      session.storedUserFields(
        { token: 't', access_token: 'a', refresh_token: 'r', email: 'e@x.y' } as any,
        permissions,
      ),
    ).toEqual({
      token: 't',
      access_token: 'a',
      refresh_token: 'r',
      email: 'e@x.y',
      dedicated_session: false,
      permissions,
    });
  });

  it('adopts the tokens a stored user carries', () => {
    const session = makeSession();
    const expiresAt = inAnHour();

    session.restore({ access_token: 'a', refresh_token: 'r', expires_at: expiresAt } as any);

    expect(session.accessToken).toBe('a');
    expect(session.refreshToken).toBe('r');
    expect(session.expiresAt).toBe(expiresAt);
  });
});

describe('TurboSession setActiveSiteAndRefresh', () => {
  function sessionOnSite() {
    const session = makeSession({ siteId: 'site-123' });
    session.accessToken = 'stale-token';
    session.refreshToken = 'refresh-token';
    session.expiresAt = inAnHour();
    return session;
  }

  function answering(put: (url: string) => Promise<unknown>) {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/auth/v1/token')) {
        return Promise.resolve(refreshResponse({ access_token: 'fresh-token' }));
      }
      return put(url);
    }) as any;
  }

  function putCalls() {
    return (global.fetch as jest.Mock).mock.calls.filter(([url]) => url.includes('/auth/v1/user'));
  }

  it('refreshes an expired token before sending it, instead of PUTting a stale one', async () => {
    const session = sessionOnSite();
    session.expiresAt = Math.floor(Date.now() / 1000) - 100;
    answering(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

    await session.setActiveSiteAndRefresh();

    expect(putCalls()[0][1].headers.Authorization).toBe('Bearer fresh-token');
  });

  it('retries once after a 401, refreshing the token in between', async () => {
    const session = sessionOnSite();
    let putCallCount = 0;
    answering(() => {
      putCallCount += 1;
      return Promise.resolve({ ok: putCallCount > 1, status: 401 });
    });

    await session.setActiveSiteAndRefresh();

    expect(putCalls()).toHaveLength(2);
    expect(putCalls()[1][1].headers.Authorization).toBe('Bearer fresh-token');
  });

  it('throws a friendly session-expired error instead of the raw response when the retry also fails', async () => {
    const session = sessionOnSite();
    answering(() => Promise.resolve({ ok: false, status: 403 }));

    await expect(session.setActiveSiteAndRefresh()).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
  });

  it('throws the friendly error without retrying the PUT when the reactive refresh itself is terminal', async () => {
    const session = sessionOnSite();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as any;

    await expect(session.setActiveSiteAndRefresh()).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
    expect(putCalls()).toHaveLength(1);
  });

  it('does nothing when there is no access token or site id', async () => {
    const session = makeSession();
    global.fetch = jest.fn() as any;

    await session.setActiveSiteAndRefresh();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not throw when the PUT succeeds but the trailing opportunistic refresh fails', async () => {
    const session = sessionOnSite();
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

    await expect(session.setActiveSiteAndRefresh()).resolves.toBeUndefined();
  });
});

describe('TurboSession fetchPermissions', () => {
  const baseUrl = 'https://sb.example.com';

  it('returns undefined when there is no active session', async () => {
    const session = makeSession({ siteId: 'site-123' });
    global.fetch = jest.fn() as any;

    await expect(session.fetchPermissions(baseUrl)).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and returns permissions scoped to the current site', async () => {
    const session = makeSession({ siteId: 'site-123' });
    session.accessToken = 'access-123';
    const permissions = { collections: { posts: 'view', drafts: 'none' } };
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(permissions) }) as any;

    await expect(session.fetchPermissions(baseUrl)).resolves.toEqual(permissions);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://sb.example.com/functions/v1/permissions?site_id=site-123');
    expect(init.headers.Authorization).toBe('Bearer access-123');
  });

  it('refreshes an expiring token before sending it, instead of 401ing', async () => {
    const session = makeSession({ siteId: 'site-123' });
    session.accessToken = 'stale-token';
    session.refreshToken = 'refresh-1';
    // Inside REFRESH_BUFFER_SECONDS, so this token is about to expire.
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    session.getRefreshedAccessToken = jest.fn().mockImplementation(async () => {
      session.accessToken = 'fresh-token';
      session.expiresAt = inAnHour();
      return 'fresh-token';
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }) as any;

    await session.fetchPermissions(baseUrl);

    // `authenticate` runs this concurrently with `currentUser`, so it cannot
    // rely on currentUser's refresh having landed first. A 401 here does not
    // fail loudly — it silently drops the editor's collection restrictions.
    expect(session.getRefreshedAccessToken).toHaveBeenCalled();
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe(
      'Bearer fresh-token',
    );
  });

  it('treats any other failure as soft, so a blip does not block login', async () => {
    const session = makeSession({ siteId: 'site-123' });
    session.accessToken = 'access-123';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;

    await expect(session.fetchPermissions(baseUrl)).resolves.toBeUndefined();
    expect(session.accessToken).toBe('access-123');
  });

  it('rejects and drops the session when the user is not a member of the site', async () => {
    // A team member who is not assigned to this site: the proxy refuses every
    // request, so the login itself has to fail rather than land the editor in
    // a CMS that raises one 403 toast per collection.
    const logout = jest.fn();
    const session = makeSession({ siteId: 'site-123', logout });
    session.accessToken = 'access-123';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 }) as any;

    await expect(session.fetchPermissions(baseUrl)).rejects.toThrow(
      "doesn't have access to this site",
    );
    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe('TurboSession clear', () => {
  function liveSession() {
    const session = makeSession();
    session.accessToken = 'access-token';
    session.refreshToken = 'refresh-token';
    session.expiresAt = inAnHour();
    session.identity = { user_email: 'editor@example.com' } as any;
    return session;
  }

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
  });

  it('forgets everything about the session', async () => {
    const session = liveSession();
    expect(await session.authStatus()).toBe(true);

    session.clear();

    expect(session.accessToken).toBeNull();
    expect(session.refreshToken).toBeNull();
    expect(session.expiresAt).toBeNull();
    expect(session.identity).toBeNull();
    expect(await session.authStatus()).toBe(false);
  });

  it('revokes a session Turbo minted for this CMS alone', () => {
    const session = liveSession();
    session.dedicated = true;

    session.clear();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://supabase-project-id.supabase.co/auth/v1/logout?scope=local',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
    expect(session.dedicated).toBe(false);
  });

  it('never revokes a session shared with the Turbo dashboard', () => {
    liveSession().clear();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('keeps the latch, which only the next login clears', () => {
    const session = liveSession();
    session.invalidate(SESSION_EXPIRED_MESSAGE);

    expect(session.invalidMessage).toBe(SESSION_EXPIRED_MESSAGE);
  });
});

describe('TurboSession authStatus', () => {
  it('refreshes a token that is about to expire', async () => {
    const session = makeSession();
    session.accessToken = 'old';
    session.refreshToken = 'refresh';
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    session.getRefreshedAccessToken = jest.fn().mockResolvedValue('new');

    await expect(session.authStatus()).resolves.toBe(true);
    expect(session.getRefreshedAccessToken).toHaveBeenCalledTimes(1);
  });

  it('stays authenticated over a transient refresh failure, not over a terminal one', async () => {
    const session = makeSession();
    session.accessToken = 'old';
    session.refreshToken = 'refresh';
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;

    session.getRefreshedAccessToken = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('offline'), { isTerminal: false }));
    await expect(session.authStatus()).resolves.toBe(true);

    session.getRefreshedAccessToken = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('dead'), { isTerminal: true }));
    await expect(session.authStatus()).resolves.toBe(false);
  });

  it('is unauthenticated with an expiring token and nothing to refresh it with', async () => {
    const session = makeSession();
    session.accessToken = 'old';
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;

    await expect(session.authStatus()).resolves.toBe(false);
  });
});

describe('TurboSession shared across tabs', () => {
  // A Supabase access token is only read for its `session_id` claim here.
  function accessToken(sessionId: string, version = 1) {
    return `header.${btoa(JSON.stringify({ session_id: sessionId, v: version }))}.signature`;
  }

  function tabWithExpiringSession(stored: any) {
    const session = makeSession({
      updateUserCredentials: jest.fn(),
      retrieveUserCredentials: () => stored,
    });
    session.accessToken = accessToken('session-1');
    session.refreshToken = 'refresh-1';
    session.expiresAt = Math.floor(Date.now() / 1000) + 10;
    session.delay = jest.fn().mockResolvedValue(undefined);
    return session;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        refreshResponse({ access_token: accessToken('session-1', 3), refresh_token: 'refresh-3' }),
      ) as any;
  });

  it('adopts the pair another tab refreshed instead of spending a dead refresh token', async () => {
    const rotated = {
      access_token: accessToken('session-1', 2),
      refresh_token: 'refresh-2',
      expires_at: inAnHour(),
    };
    const onTokensChanged = jest.fn();
    const session = tabWithExpiringSession(rotated);
    (session as any).onTokensChanged = onTokensChanged;

    await expect(session.getRefreshedAccessToken()).resolves.toBe(rotated.access_token);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(session.refreshToken).toBe('refresh-2');
    expect(session.expiresAt).toBe(rotated.expires_at);
    expect(onTokensChanged).toHaveBeenCalledWith(rotated.access_token);
  });

  it('refreshes with the adopted token when the stored pair is itself expiring', async () => {
    const session = tabWithExpiringSession({
      access_token: accessToken('session-1', 2),
      refresh_token: 'refresh-2',
      expires_at: Math.floor(Date.now() / 1000) + 10,
    });

    await session.getRefreshedAccessToken();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
      refresh_token: 'refresh-2',
    });
    expect(session.refreshToken).toBe('refresh-3');
  });

  it('does not adopt a stored session from a different login', async () => {
    const session = tabWithExpiringSession({
      access_token: accessToken('session-2'),
      refresh_token: 'refresh-other',
      expires_at: inAnHour(),
    });

    await session.getRefreshedAccessToken();

    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
      refresh_token: 'refresh-1',
    });
  });

  it('refreshes normally when nothing newer is stored', async () => {
    const session = tabWithExpiringSession(null);

    await session.getRefreshedAccessToken();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(session.refreshToken).toBe('refresh-3');
  });
});

describe('TurboSession identity', () => {
  const USER_ID = '3f2b1c4d-0000-4a5b-8c9d-1e2f3a4b5c6d';

  function segment(value: unknown) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  }

  function signedIn(overrides: Record<string, unknown> = {}) {
    const session = makeSession();
    session.accessToken = `${segment({ alg: 'HS256' })}.${segment({ sub: USER_ID })}.signature`;
    session.identity = {
      user_email: 'decap@p-m.si',
      user_metadata: { full_name: 'Decap Tester', picture: 'https://cdn.example.com/ed.png' },
      ...overrides,
    } as any;
    return session;
  }

  it('reports the signed-in Turbo user for the header', () => {
    expect(signedIn().sessionIdentity()).toEqual({
      name: 'Decap Tester',
      email: 'decap@p-m.si',
      avatarUrl: 'https://cdn.example.com/ed.png',
    });
  });

  it('falls back to the email local part and no avatar when the account has neither', () => {
    expect(signedIn({ user_metadata: {} }).sessionIdentity()).toEqual({
      name: 'decap',
      email: 'decap@p-m.si',
      avatarUrl: null,
    });
  });

  it('knows nobody before a login', () => {
    expect(makeSession().sessionIdentity()).toEqual({
      name: undefined,
      email: undefined,
      avatarUrl: null,
    });
  });

  it('attributes a note to the editor by name and Supabase user id', () => {
    expect(signedIn().noteAuthorIdentity()).toEqual({
      author: 'Decap Tester',
      authorId: USER_ID,
    });
  });

  it('falls back to the email when the session carries no name', () => {
    // resolveCommitAuthorFromSupabaseUser already names an unnamed user after
    // the local part, which is better than an empty byline.
    expect(signedIn({ user_metadata: {} }).noteAuthorIdentity().author).toBe('decap');
  });

  it('records no id when there is no session to read one from', () => {
    const session = signedIn();
    session.accessToken = null;

    // Both or neither: lib-util drops a name with no id to compare against,
    // and ownership falls back to comparing names.
    expect(session.noteAuthorIdentity().authorId).toBeUndefined();
  });
});
