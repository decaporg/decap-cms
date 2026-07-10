import { registerCommonMiddlewares } from './middlewares/common';
import { registerMiddleware as localGit } from './middlewares/localGit';
import { registerMiddleware as localFs } from './middlewares/localFs';
import { createLogger } from './logger';

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
