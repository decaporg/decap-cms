import express from 'express';
import { registerCommonMiddlewares } from './middlewares/common';
import { registerMiddleware as localGit } from './middlewares/localGit';
import { registerMiddleware as localFs } from './middlewares/localFs';

export const registerLocalGit = async (app: express.Express) => {
  registerCommonMiddlewares(app);
  await localGit(app);
};

export const registerLocalFs = async (app: express.Express) => {
  registerCommonMiddlewares(app);
  await localFs(app);
};
