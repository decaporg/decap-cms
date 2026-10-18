/**
 * `@decap/cli/dev`: the programmatic API of the local proxy server, formerly
 * `decap-server/dist/middlewares`. Mount Decap's proxy endpoints on your own
 * Express app with `registerLocalFs` or `registerLocalGit`, or start the
 * standalone server with `runDevServer` (what `decap dev` does).
 */
import { registerCommonMiddlewares } from './middlewares/common/index.js';
import { registerMiddleware as localGit } from './middlewares/localGit/index.js';
import { registerMiddleware as localFs } from './middlewares/localFs/index.js';
import { createLogger } from './logger.js';

import type express from 'express';

type Options = {
  logLevel?: string;
};

function createOptions(options: Options) {
  return {
    logger: createLogger({ level: options.logLevel || 'info' }),
  };
}

export async function registerLocalGit(app: express.Express, options: Options = {}) {
  const opts = createOptions(options);
  registerCommonMiddlewares(app, opts);
  await localGit(app, opts);
}

export async function registerLocalFs(app: express.Express, options: Options = {}) {
  const opts = createOptions(options);
  registerCommonMiddlewares(app, opts);
  await localFs(app, opts);
}

export { runDevServer } from './server.js';
export type { DevServerOptions } from './server.js';
