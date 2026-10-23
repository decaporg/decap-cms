import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import type winston from 'winston';

export type Options = {
  logger: winston.Logger;
};

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Addresses that only accept connections from this machine. */
export function isLoopbackAddress(host: string) {
  const name = host.toLowerCase().replace(/^\[(.*)\]$/, '$1');
  return (
    name === 'localhost' ||
    name.endsWith('.localhost') ||
    name === '::1' ||
    /^127(\.\d{1,3}){3}$/.test(name)
  );
}

/** The hostname of a Host header, without its port: `[::1]:8081` → `[::1]`. */
function hostnameOf(hostHeader: string) {
  return hostHeader.startsWith('[')
    ? hostHeader.slice(0, hostHeader.indexOf(']') + 1)
    : hostHeader.split(':')[0];
}

/**
 * The proxy has no authentication: whoever can call it can read and write the
 * repository. CORS only stops a page from reading responses, so also refuse
 * requests a browser sends on behalf of another origin, and, while the server
 * is only reachable from this machine, requests addressed to any other host
 * name: that is how a DNS-rebinding page reaches a localhost server.
 */
function requestGuard(allowedOrigin: string | RegExp): express.RequestHandler {
  const bindHost = process.env.BIND_HOST;
  const checkHost = !bindHost || isLoopbackAddress(bindHost);

  return (req, res, next) => {
    const { origin, host } = req.headers;
    // Requests without an Origin header don't come from a web page.
    const originAllowed =
      origin === undefined ||
      allowedOrigin === '*' ||
      (typeof allowedOrigin === 'string' ? origin === allowedOrigin : allowedOrigin.test(origin));
    if (!originAllowed) {
      res
        .status(403)
        .json({ error: `Origin ${origin} is not allowed; set ORIGIN to the CMS origin` });
      return;
    }
    if (checkHost && !isLoopbackAddress(hostnameOf(host || ''))) {
      res.status(403).json({ error: `Host ${host} is not allowed` });
      return;
    }
    next();
  };
}

export function registerCommonMiddlewares(app: express.Express, options: Options) {
  const { logger } = options;
  const stream = {
    write: (message: string) => {
      logger.debug(String(message).trim());
    },
  };
  const allowedOrigin = process.env.ORIGIN || LOCALHOST_ORIGIN;
  app.use(morgan('combined', { stream }));
  app.use('/api/v1', requestGuard(allowedOrigin));
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: '50mb' }));
}
