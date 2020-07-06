import express from 'express';
import { registerCommonMiddlewares } from './middlewares/common';
import { registerMiddleware as localGit } from './middlewares/localGit';
import { registerMiddleware as localFs } from './middlewares/localFs';
import { createLogger } from './logger';

type Options = {
  logLevel?: string;
};

const createOptions = (options: Options) => {
  return {
    logger: createLogger({ level: options.logLevel || 'info' }),
  };
};

export const registerLocalGit = async (app: express.Express, options: Options = {}) => {
  const opts = createOptions(options);
  registerCommonMiddlewares(app, opts);
  await localGit(app, opts);
};

export const registerLocalFs = async (app: express.Express, options: Options = {}) => {
  const opts = createOptions(options);
  registerCommonMiddlewares(app, opts);
  await localFs(app, opts);
};
