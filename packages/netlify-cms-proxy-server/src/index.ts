require('dotenv').config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { registerMiddleware as registerLocalGit } from './middlewares/localGit';

const app = express();
const port = process.env.PORT || 8081;

(async () => {
  app.use(morgan('combined'));
  app.use(cors());
  app.use(express.json());

  try {
    await registerLocalGit(app);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  return app.listen(port, () => {
    console.log(`Netlify CMS Proxy Server listening on port ${port}`);
  });
})();
