import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import type winston from 'winston';

export type Options = {
  logger: winston.Logger;
};

export function registerCommonMiddlewares(app: express.Express, options: Options) {
  const { logger } = options;
  const stream = {
    write: (message: string) => {
      logger.debug(String(message).trim());
    },
  };
  app.use(morgan('combined', { stream }));
  app.use(
    cors({
      origin: process.env.ORIGIN || '*',
    }),
  );
  app.use(express.json({ limit: '50mb' }));
}
