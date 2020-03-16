require('dotenv').config();
import express from 'express';
import { registerCommonMiddlewares } from './middlewares/common';
import { registerMiddleware as registerLocalGit } from './middlewares/localGit';
import { registerMiddleware as registerLocalFs } from './middlewares/localFs';

const app = express();
const port = process.env.PORT || 8081;

(async () => {
  registerCommonMiddlewares(app);

  try {
    const mode = process.env.MODE || 'fs';
    if (mode === 'fs') {
      registerLocalFs(app);
    } else if (mode === 'git') {
      registerLocalGit(app);
    } else {
      throw new Error(`Unknown proxy mode '${mode}'`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  return app.listen(port, () => {
    console.log(`Netlify CMS Proxy Server listening on port ${port}`);
  });
})();
