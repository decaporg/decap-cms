require('dotenv').config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { localGitMiddleware, getSchema } from './middlewares/localGitMiddleware';
import { joi } from './middlewares/joi';

const app = express();
const port = process.env.PORT || 8081;

app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

if (process.env.GIT_REPO_DIRECTORY) {
  app.post('/api/v1', joi(getSchema({ repoPath: process.env.GIT_REPO_DIRECTORY })));
  app.post('/api/v1', localGitMiddleware({ repoPath: process.env.GIT_REPO_DIRECTORY }));
  console.log(`Netlify CMS Proxy Server configured with ${process.env.GIT_REPO_DIRECTORY}`);
}

app.listen(port, () => {
  console.log(`Netlify CMS Proxy Server listening on port ${port}`);
});
