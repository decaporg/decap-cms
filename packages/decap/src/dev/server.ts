import dotenv from 'dotenv';
import express from 'express';

import { isLoopbackAddress, registerCommonMiddlewares } from './middlewares/common/index.js';
import { registerMiddleware as registerLocalGit } from './middlewares/localGit/index.js';
import { registerMiddleware as registerLocalFs } from './middlewares/localFs/index.js';
import { createLogger } from './logger.js';

import type { Server } from 'http';
import type { AddressInfo } from 'net';

/**
 * `decap dev` flags. Each one overrides the environment variable decap-server
 * has always read, and the variables themselves (including a `.env` file in
 * the working directory) keep working unchanged.
 */
export interface DevServerOptions {
  /** PORT, default 8081. */
  port?: number;
  /** BIND_HOST: listen on this address only. */
  host?: string;
  /** MODE: `fs` (default) writes files directly, `git` commits and supports the editorial workflow. */
  mode?: string;
  /** GIT_REPO_DIRECTORY, default the current directory. */
  dir?: string;
  /** ORIGIN: the CMS origin allowed to call the server, default localhost. */
  origin?: string;
  /** LOG_LEVEL, default `info`. */
  logLevel?: string;
}

const ENV_FOR_OPTION: Record<Exclude<keyof DevServerOptions, 'port'>, string> = {
  host: 'BIND_HOST',
  mode: 'MODE',
  dir: 'GIT_REPO_DIRECTORY',
  origin: 'ORIGIN',
  logLevel: 'LOG_LEVEL',
};

/**
 * The local proxy server for Decap's `proxy` backend: `decap dev`, formerly
 * `npx decap-server`. Lets the CMS read and write the repository on disk.
 */
export async function runDevServer(options: DevServerOptions = {}): Promise<Server> {
  dotenv.config();

  // The middlewares read their settings from the environment, so flags are
  // applied there rather than threaded through every call.
  if (options.port !== undefined) process.env.PORT = String(options.port);
  for (const [option, variable] of Object.entries(ENV_FOR_OPTION)) {
    const value = options[option as keyof typeof ENV_FOR_OPTION];
    if (value !== undefined) process.env[variable] = value;
  }

  const app = express();
  const port = parseInt(process.env.PORT || '8081', 10);
  const host = process.env.BIND_HOST;
  const logger = createLogger({ level: process.env.LOG_LEVEL || 'info' });
  const middlewareOptions = { logger };

  registerCommonMiddlewares(app, middlewareOptions);

  const mode = process.env.MODE || 'fs';
  if (mode === 'fs') {
    await registerLocalFs(app, middlewareOptions);
  } else if (mode === 'git') {
    await registerLocalGit(app, middlewareOptions);
  } else {
    throw new Error(`Unknown proxy mode '${mode}'. Use fs or git.`);
  }

  // The "listening" lines are matched by the e2e suite (cypress/plugins/proxy.js)
  // and possibly by people's own scripts: keep their wording.
  if (host) {
    const server = await listen(app, port, host);
    logger.info(`Decap CMS Proxy Server listening on ${host}:${port}`);
    if (!isLoopbackAddress(host)) {
      logger.warn(
        `The proxy has no authentication: anyone who can reach ${host}:${port} can read and write files in your repository`,
      );
    }
    return server;
  }

  // The server can write any file in the repository, so by default it only
  // listens on this machine. The CMS calls http://localhost:8081, and
  // localhost resolves to either loopback address, so listen on both.
  const server = await listen(app, port, '127.0.0.1');
  try {
    // The bound port, not `port`, which may be 0 for "any free port".
    const ipv6Server = await listen(app, (server.address() as AddressInfo).port, '::1');
    server.on('close', () => ipv6Server.close());
  } catch (e) {
    // IPv6 disabled on this machine: browsers fall back to 127.0.0.1.
    if (!['EADDRNOTAVAIL', 'EAFNOSUPPORT'].includes((e as NodeJS.ErrnoException).code!)) {
      server.close();
      throw e;
    }
  }
  logger.info(
    `Decap CMS Proxy Server listening on port ${port} (this machine only; pass --host 0.0.0.0 to expose it)`,
  );
  return server;
}

function listen(app: express.Express, port: number, host: string): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve(server));
    // Without this, a failed listen() (e.g. the port is taken) throws as an
    // uncaught EventEmitter error — a raw stack trace — instead of rejecting
    // this promise, which main() turns into a clean one-line "✗ message".
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use; pass --port <other>`));
      } else {
        reject(err);
      }
    });
  });
}
