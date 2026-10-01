import dotenv from 'dotenv';
import express from 'express';

import { registerCommonMiddlewares } from './middlewares/common/index.js';
import { registerMiddleware as registerLocalGit } from './middlewares/localGit/index.js';
import { registerMiddleware as registerLocalFs } from './middlewares/localFs/index.js';
import { createLogger } from './logger.js';

import type { Server } from 'http';

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
  return new Promise(resolve => {
    if (host) {
      const server = app.listen(port, host, () => {
        logger.info(`Decap CMS Proxy Server listening on ${host}:${port}`);
        resolve(server);
      });
    } else {
      const server = app.listen(port, () => {
        logger.info(`Decap CMS Proxy Server listening on port ${port}`);
        resolve(server);
      });
    }
  });
}
