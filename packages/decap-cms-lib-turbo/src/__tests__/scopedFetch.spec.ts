import { createRequestCoalescer } from '../requestCoalescer';
import { createProxyMeter } from '../saveMetrics';
import {
  createScopedFetch,
  exposeProxyError,
  peekBody,
  proxyErrorMessage,
  sessionEndedResponse,
} from '../scopedFetch';
import { SESSION_EXPIRED_MESSAGE, TurboSession } from '../session';

import type { ProxyMeter } from '../saveMetrics';
import type { TurboSessionOptions } from '../session';

const proxyUrl = 'https://supabase.example/functions/v1/gh/_content/sync';

function reply(status: number, body: string, contentType = 'text/plain') {
  const response: any = {
    ok: status < 400,
    status,
    statusText: status === 404 ? 'Not Found' : '',
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

function setup(options: Partial<TurboSessionOptions> = {}) {
  const session = new TurboSession({
    supabaseId: 'supabase-project-id',
    anonKey: 'supabase-anon-key',
    siteId: 'site-123',
    ...options,
  });
  session.accessToken = 'old-token';
  session.refreshToken = 'refresh-token';
  session.expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const host: { proxyMeter: ProxyMeter | null } = { proxyMeter: null };
  const fetch = createScopedFetch({
    proxyMarker: '/functions/v1/gh',
    session,
    getToken: () => session.accessToken || '',
    coalesce: createRequestCoalescer(),
    getMeter: () => host.proxyMeter,
  });
  return { session, host, fetch };
}

function refreshesTo(session: TurboSession, token: string) {
  session.getRefreshedAccessToken = jest.fn().mockImplementation(async () => {
    session.accessToken = token;
    return token;
  });
}

function refreshIsRefused(session: TurboSession) {
  const terminal = Object.assign(new Error('refresh_token_not_found'), { isTerminal: true });
  session.getRefreshedAccessToken = jest.fn().mockRejectedValue(terminal);
}

describe('createScopedFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes proxy requests with auth header, x-site-id, and site_id query param', async () => {
    const { fetch } = setup();
    global.fetch = jest.fn().mockResolvedValue(ok());

    await fetch('https://supabase.example/functions/v1/gh/repos/owner/repo');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://supabase.example/functions/v1/gh/repos/owner/repo?site_id=site-123');
    expect(init.headers.Authorization).toBe('Bearer old-token');
    expect(init.headers['x-site-id']).toBe('site-123');
  });

  it('sends the token but no site scoping to a URL that is not the proxy', async () => {
    const { fetch } = setup();
    global.fetch = jest.fn().mockResolvedValue(ok());

    await fetch('https://api.example/repos/owner/repo');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.example/repos/owner/repo');
    expect(init.headers.Authorization).toBe('Bearer old-token');
    expect(init.headers['x-site-id']).toBeUndefined();
  });

  it('throws on a non-2xx response instead of resolving', async () => {
    const { fetch } = setup();
    global.fetch = jest.fn().mockResolvedValue(reply(404, '{"message":"Not Found"}'));

    await expect(fetch('https://api.example/repos/owner/repo')).rejects.toMatchObject({
      status: 404,
      message: 'Not Found',
    });
  });

  it('feeds the save meter and joins concurrent identical reads', async () => {
    const { fetch, host } = setup();
    host.proxyMeter = createProxyMeter();
    global.fetch = jest.fn().mockResolvedValue(ok());

    await Promise.all([fetch(proxyUrl), fetch(proxyUrl)]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(host.proxyMeter.requests).toBe(1);
  });

  it('refreshes once on a proxy 401 and retries with the new token', async () => {
    const { fetch, session } = setup();
    refreshesTo(session, 'new-token');
    global.fetch = jest.fn().mockResolvedValueOnce(refused()).mockResolvedValueOnce(ok());

    await fetch(proxyUrl, { method: 'POST' });

    expect(session.getRefreshedAccessToken).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[1][1].headers.Authorization).toBe(
      'Bearer new-token',
    );
  });

  it('ends the session once when the refresh is refused, then fails fast', async () => {
    const onSessionInvalid = jest.fn();
    const logout = jest.fn();
    const { fetch, session } = setup({ onSessionInvalid, logout });
    refreshIsRefused(session);
    global.fetch = jest.fn().mockResolvedValue(refused());

    await expect(fetch(proxyUrl)).rejects.toMatchObject({ status: 401 });
    await expect(fetch(proxyUrl)).rejects.toThrow(SESSION_EXPIRED_MESSAGE);

    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(onSessionInvalid).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
    expect(logout).toHaveBeenCalledTimes(1);
    // The second call never reached the network.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ends the session when the retry is refused too', async () => {
    const onSessionInvalid = jest.fn();
    const { fetch, session } = setup({ onSessionInvalid });
    refreshesTo(session, 'new-token');
    global.fetch = jest.fn().mockResolvedValue(refused());

    await expect(fetch(proxyUrl)).rejects.toMatchObject({ status: 401 });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
  });

  it('does not log out over a git host 401 passed through the proxy', async () => {
    const onSessionInvalid = jest.fn();
    const { fetch, session } = setup({ onSessionInvalid });
    session.getRefreshedAccessToken = jest.fn();
    global.fetch = jest
      .fn()
      .mockResolvedValue(reply(401, '{"message":"Bad credentials"}', 'application/json'));

    await expect(fetch(proxyUrl)).rejects.toMatchObject({
      status: 401,
      message: 'Bad credentials',
    });

    expect(session.getRefreshedAccessToken).not.toHaveBeenCalled();
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });

  it('ends the session on a 403 for a site the user lost access to', async () => {
    const onSessionInvalid = jest.fn();
    const { fetch } = setup({ onSessionInvalid });
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        reply(403, '{"error":"Forbidden: no access to requested site"}', 'application/json'),
      );

    await expect(fetch(proxyUrl)).rejects.toMatchObject({ status: 403 });

    expect(onSessionInvalid).toHaveBeenCalledWith(
      expect.stringContaining("doesn't have access to this site"),
    );
  });

  it("shows the proxy's error sentence rather than the JSON around it", async () => {
    const { fetch } = setup();
    global.fetch = jest
      .fn()
      .mockResolvedValue(reply(403, '{"error":"This site is read-only"}', 'application/json'));

    await expect(fetch(proxyUrl, { method: 'POST' })).rejects.toThrow(/^This site is read-only$/);
  });

  it('does not end the session over a refusal the editor can retry past', async () => {
    const onSessionInvalid = jest.fn();
    const { fetch, session } = setup({ onSessionInvalid });
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        reply(403, '{"error":"Forbidden: x","code":"repo_mismatch"}', 'application/json'),
      );

    await expect(fetch(proxyUrl)).rejects.toMatchObject({ status: 403 });

    expect(onSessionInvalid).not.toHaveBeenCalled();
    expect(session.invalidMessage).toBeNull();
  });

  it('ends the session once with the server sentence on a configuration refusal, then stops asking', async () => {
    const onSessionInvalid = jest.fn();
    const { fetch } = setup({ onSessionInvalid });
    const body = {
      error: 'This organization has no GitHub connection.',
      code: 'github_not_connected',
    };
    global.fetch = jest
      .fn()
      .mockResolvedValue(reply(409, JSON.stringify(body), 'application/json'));

    await expect(fetch(proxyUrl)).rejects.toMatchObject({ status: 409, message: body.error });
    await expect(fetch(proxyUrl)).rejects.toThrow(body.error);

    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(onSessionInvalid).toHaveBeenCalledWith(body.error);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('proxy response helpers', () => {
  it('reads the sentence out of either JSON shape, or returns a plain body as is', () => {
    expect(proxyErrorMessage('{"error":"slug too long"}')).toBe('slug too long');
    expect(proxyErrorMessage('{"message":"Not Found"}')).toBe('Not Found');
    expect(proxyErrorMessage('Unauthorized')).toBe('Unauthorized');
  });

  it('peeks at a body without consuming it', async () => {
    const response = reply(403, '{"error":"x"}');
    await expect(peekBody(response)).resolves.toBe('{"error":"x"}');
    await expect(response.text()).resolves.toBe('{"error":"x"}');
    await expect(peekBody({} as Response)).resolves.toBe('');
  });

  it('reads the cached JSON of a 403 that requestWithBackoff already consumed', async () => {
    const consumed = {
      bodyUsed: true,
      json: () => Promise.resolve({ error: 'no access to requested site', code: 'x' }),
      clone: () => {
        throw new TypeError(
          "Failed to execute 'clone' on 'Response': Response body is already used",
        );
      },
    } as unknown as Response;
    await expect(peekBody(consumed)).resolves.toBe(
      '{"error":"no access to requested site","code":"x"}',
    );

    const unreadable = { bodyUsed: true, json: () => Promise.reject(new Error('used')) };
    await expect(peekBody(unreadable as unknown as Response)).resolves.toBe('');
  });

  it('makes a proxy refusal parse as its sentence where the client expects `message`', async () => {
    const exposed = exposeProxyError(reply(403, '{"error":"read-only"}'), '{"error":"read-only"}');
    await expect(exposed.json()).resolves.toEqual({ error: 'read-only', message: 'read-only' });
    await expect(exposed.text()).resolves.toBe('read-only');

    const untouched = reply(401, '{"message":"401 Unauthorized"}');
    expect(exposeProxyError(untouched, '{"message":"401 Unauthorized"}')).toBe(untouched);
  });

  it('answers a request on an ended session with a 401 carrying the reason', async () => {
    const response = sessionEndedResponse(SESSION_EXPIRED_MESSAGE);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: SESSION_EXPIRED_MESSAGE });
    expect(response.clone()).toBe(response);
  });
});
