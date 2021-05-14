import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import type { Logger } from 'winston';
import type { Express } from 'express';

export type Options = {
  logger: Logger;
};

export function registerCommonMiddlewares(app: Express, options: Options) {
  const { logger } = options;
  const stream = {
    write: (message: string) => {
      logger.debug(String(message).trim());
    },
  };
  app.use(morgan('combined', { stream }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
}
