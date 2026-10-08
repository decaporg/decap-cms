import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import { credentialsPath, readCredentials, writeCredentials } from '../config.js';
import { logout } from '../login.js';

import type { AddressInfo } from 'net';

const TOKEN = 'dcp_' + 'a'.repeat(43);

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
