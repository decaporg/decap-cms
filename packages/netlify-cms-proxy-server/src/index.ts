require('dotenv').config();
import express from 'express';
import { registerCommonMiddlewares } from './middlewares/common';
import { registerMiddleware as registerLocalGit } from './middlewares/localGit';
import { registerMiddleware as registerLocalFs } from './middlewares/localFs';
import { createLogger } from './logger';

const app = express();
const port = process.env.PORT || 8081;
const level = process.env.LOG_LEVEL || 'info';

(async () => {
  const logger = createLogger({ level });
  const options = {
    logger,
  };

  registerCommonMiddlewares(app, options);

  try {
    const mode = process.env.MODE || 'fs';
    if (mode === 'fs') {
      registerLocalFs(app, options);
    } else if (mode === 'git') {
      registerLocalGit(app, options);
    } else {
      throw new Error(`Unknown proxy mode '${mode}'`);
    }
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }

  return app.listen(port, () => {
    logger.info(`Netlify CMS Proxy Server listening on port ${port}`);
  });
})();
