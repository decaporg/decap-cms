import winston from 'winston';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

export type Options = {
  logger: winston.Logger;
};

export const registerCommonMiddlewares = (app: express.Express, options: Options) => {
  const { logger } = options;
  const stream = {
    write: (message: string) => {
      logger.debug(String(message).trim());
    },
  };
  app.use(morgan('combined', { stream }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
};
