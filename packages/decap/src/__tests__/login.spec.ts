import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import { credentialsPath, readCredentials, writeCredentials } from '../config.js';
import { login, logout } from '../login.js';

import type { AddressInfo } from 'net';

const TOKEN = 'dcp_' + 'a'.repeat(43);
const NEW_TOKEN = 'dcp_' + 'n'.repeat(43);

/** A stand-in Turbo instance: answers each request from `routes`, and records it. */
async function fakeTurbo(
  routes: Record<string, (req: http.IncomingMessage) => { status: number; body?: unknown }>,
) {
  const requests: Array<{ method: string; path: string; authorization?: string }> = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    requests.push({
      method: req.method ?? 'GET',
      path: url.pathname,
      authorization: req.headers.authorization,
    });
    const route = routes[`${req.method} ${url.pathname}`];
    const answer = route ? route(req) : { status: 404, body: 'Not found' };
    const body =
      typeof answer.body === 'string' ? answer.body : JSON.stringify(answer.body ?? null);
    res
      .writeHead(answer.status, {
        'content-type': typeof answer.body === 'string' ? 'text/html' : 'application/json',
      })
      .end(answer.status === 204 ? undefined : body);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    url,
    requests,
    close: () => new Promise<void>(resolve => server.close(() => resolve())),
  };
}

function storeToken(apiUrl: string, token = TOKEN) {
  writeCredentials({
    apiUrl,
    token,
    tokenId: 't1',
    scope: 'editor',
    expiresAt: null,
    email: 'x@example.com',
  });
}

describe('logout', () => {
  const originalEnv = { ...process.env };
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    process.env.XDG_CONFIG_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'decap-test-'));
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warn = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('revokes the token on the instance that issued it, then forgets it', async () => {
    const turbo = await fakeTurbo({ 'POST /api/v1/cli/logout': () => ({ status: 204 }) });
    try {
      storeToken(turbo.url);
      await logout(readCredentials());
      expect(turbo.requests).toEqual([
        { method: 'POST', path: '/api/v1/cli/logout', authorization: `Bearer ${TOKEN}` },
      ]);
      expect(fs.existsSync(credentialsPath())).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await turbo.close();
    }
  });

  it('treats a token the server no longer knows as revoked', async () => {
    const turbo = await fakeTurbo({
      'POST /api/v1/cli/logout': () => ({
        status: 401,
        body: { error: { code: 'unauthorized', message: 'Token revoked.' } },
      }),
    });
    try {
      storeToken(turbo.url);
      await logout(readCredentials());
      expect(fs.existsSync(credentialsPath())).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await turbo.close();
    }
  });

  it('forgets the token when the server refuses to revoke it, and says so', async () => {
    const turbo = await fakeTurbo({
      'POST /api/v1/cli/logout': () => ({
        status: 500,
        body: { error: { code: 'internal', message: 'Something broke.' } },
      }),
    });
    try {
      storeToken(turbo.url);
      await logout(readCredentials());
      expect(fs.existsSync(credentialsPath())).toBe(false);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Signed out.'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Something broke.'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Profile → API tokens'));
    } finally {
      await turbo.close();
    }
  });

  it('forgets the token when the server cannot be reached', async () => {
    // Nothing listens on the discard port.
    storeToken('http://127.0.0.1:9');
    await logout(readCredentials());
    expect(fs.existsSync(credentialsPath())).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not reach'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('may still be valid'));
  });

  it('says so when nobody is signed in', async () => {
    await logout(readCredentials());
    expect(log).toHaveBeenCalledWith('Not signed in.');
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('login', () => {
  const originalEnv = { ...process.env };
  let warn: jest.SpyInstance;

  beforeEach(() => {
    process.env.XDG_CONFIG_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'decap-test-'));
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warn = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  /** A Turbo instance with the CLI API, answering `revoke` for /cli/logout. */
  function cliTurbo(revoke: { status: number; body?: unknown } = { status: 204 }) {
    return fakeTurbo({
      'POST /api/v1/cli/token': () => ({
        status: 200,
        body: { token: NEW_TOKEN, token_id: 't2', scope: 'editor', expires_at: null },
      }),
      'GET /api/v1/me': req =>
        req.headers.authorization
          ? {
              status: 200,
              body: { user: { id: 'u1', email: 'x@example.com', name: null }, organizations: [] },
            }
          : { status: 401, body: { error: { code: 'unauthorized', message: 'Sign in.' } } },
      'POST /api/v1/cli/logout': () => revoke,
    });
  }

  /** Stands in for the browser: approves at once by calling the loopback callback. */
  function approve(url: string) {
    const authorize = new URL(url);
    const callback = new URL(`http://127.0.0.1:${authorize.searchParams.get('port')}/callback`);
    callback.searchParams.set('state', authorize.searchParams.get('state')!);
    callback.searchParams.set('code', 'c'.repeat(43));
    void fetch(callback.toString());
  }

  it('stores the new token', async () => {
    const turbo = await cliTurbo();
    try {
      await login({ apiUrl: turbo.url, admin: false, openBrowser: approve });
      expect(readCredentials()).toMatchObject({ apiUrl: turbo.url, token: NEW_TOKEN });
      expect(turbo.requests.map(r => r.path)).not.toContain('/api/v1/cli/logout');
    } finally {
      await turbo.close();
    }
  });

  it('revokes the token it replaces', async () => {
    const turbo = await cliTurbo();
    try {
      storeToken(turbo.url);
      await login({ apiUrl: turbo.url, admin: false, openBrowser: approve });
      expect(readCredentials()?.token).toBe(NEW_TOKEN);
      expect(turbo.requests).toContainEqual({
        method: 'POST',
        path: '/api/v1/cli/logout',
        authorization: `Bearer ${TOKEN}`,
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await turbo.close();
    }
  });

  it('keeps the new login when the old token cannot be revoked, and says so', async () => {
    const turbo = await cliTurbo({
      status: 500,
      body: { error: { code: 'internal', message: 'Something broke.' } },
    });
    try {
      storeToken(turbo.url);
      await login({ apiUrl: turbo.url, admin: false, openBrowser: approve });
      expect(readCredentials()?.token).toBe(NEW_TOKEN);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('the token this login replaced'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Profile → API tokens'));
    } finally {
      await turbo.close();
    }
  });

  it.each([
    ['an older error shape', { status: 401, body: { error: 'Not authenticated' } }],
    ['an HTML page', { status: 404, body: '<!doctype html><title>Not found</title>' }],
    ['a redirect to the login page', { status: 302, body: '' }],
  ])('fails fast on an instance without the CLI API: %s', async (_, answer) => {
    const turbo = await fakeTurbo({ 'GET /api/v1/me': () => answer });
    const openBrowser = jest.fn();
    try {
      await expect(login({ apiUrl: turbo.url, admin: false, openBrowser })).rejects.toThrow(
        `${turbo.url} does not support the decap CLI yet`,
      );
      expect(openBrowser).not.toHaveBeenCalled();
    } finally {
      await turbo.close();
    }
  });

  it('fails fast when the instance cannot be reached', async () => {
    const openBrowser = jest.fn();
    await expect(
      login({ apiUrl: 'http://127.0.0.1:9', admin: false, openBrowser }),
    ).rejects.toThrow('Could not reach http://127.0.0.1:9');
    expect(openBrowser).not.toHaveBeenCalled();
  });
});
