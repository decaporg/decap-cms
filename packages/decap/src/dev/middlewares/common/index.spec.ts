import http from 'http';
import express from 'express';

import { isLoopbackAddress, registerCommonMiddlewares } from './index.js';

import type { AddressInfo } from 'net';
import type winston from 'winston';

const logger = { debug: jest.fn() } as unknown as winston.Logger;

async function startApp() {
  const app = express();
  registerCommonMiddlewares(app, { logger });
  app.post('/api/v1', (_req, res) => {
    res.json({ ok: true });
  });
  const server = await new Promise<http.Server>(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return server;
}

function post(server: http.Server, headers: Record<string, string>): Promise<number> {
  const { port } = server.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: '/api/v1',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      },
      res => {
        res.resume();
        resolve(res.statusCode!);
      },
    );
    req.on('error', reject);
    req.end('{}');
  });
}

describe('request guard', () => {
  const originalEnv = { ...process.env };
  let server: http.Server;

  afterEach(async () => {
    process.env = { ...originalEnv };
    await new Promise(resolve => server.close(resolve));
  });

  it('accepts the CMS on localhost', async () => {
    server = await startApp();
    expect(await post(server, { Host: 'localhost:8081', Origin: 'http://localhost:1313' })).toBe(
      200,
    );
    expect(await post(server, { Host: '[::1]:8081' })).toBe(200);
  });

  it('refuses other origins', async () => {
    server = await startApp();
    expect(await post(server, { Host: 'localhost:8081', Origin: 'https://evil.example' })).toBe(
      403,
    );
  });

  it('refuses other host names, as sent after DNS rebinding', async () => {
    server = await startApp();
    expect(await post(server, { Host: 'evil.example:8081' })).toBe(403);
    expect(await post(server, { Host: '127.evil.example:8081' })).toBe(403);
  });

  it('accepts the configured ORIGIN', async () => {
    process.env.ORIGIN = 'https://cms.example';
    server = await startApp();
    expect(await post(server, { Host: 'localhost:8081', Origin: 'https://cms.example' })).toBe(200);
    expect(await post(server, { Host: 'localhost:8081', Origin: 'http://localhost:1313' })).toBe(
      403,
    );
  });

  it('accepts any host name once the server is bound to the network', async () => {
    process.env.BIND_HOST = '0.0.0.0';
    server = await startApp();
    expect(await post(server, { Host: '192.168.1.5:8081' })).toBe(200);
  });
});

describe('isLoopbackAddress', () => {
  it.each(['localhost', 'cms.localhost', '127.0.0.1', '127.1.2.3', '::1', '[::1]'])(
    '%s is loopback',
    host => expect(isLoopbackAddress(host)).toBe(true),
  );

  it.each(['0.0.0.0', '::', '192.168.1.5', '127.evil.example', 'localhost.evil.example'])(
    '%s is not loopback',
    host => expect(isLoopbackAddress(host)).toBe(false),
  );
});
