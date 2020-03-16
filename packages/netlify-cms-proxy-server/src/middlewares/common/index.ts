import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

export const registerCommonMiddlewares = (app: express.Express) => {
  app.use(morgan('combined'));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
};
