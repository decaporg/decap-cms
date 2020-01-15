import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import Joi from '@hapi/joi';
import { defaultSchema } from './joi';
// import simpleGit from 'simple-git/promise';

const listFiles = async (dir: string) => {
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  return files;
};

export const getSchema = ({ repoPath }: { repoPath: string }) => {
  const custom = Joi.extend({
    type: 'path',
    base: Joi.string().required(),
    messages: {
      'path.invalid': '{{#label}} must resolve to a path under the configured repository',
    },
    validate(value, helpers) {
      const resolvedPath = path.join(repoPath, value);
      console.log(resolvedPath.startsWith(repoPath));
      if (!resolvedPath.startsWith(repoPath)) {
        return { value, errors: helpers.error('path.invalid') };
      }
    },
  });
  const schema = defaultSchema({ path: custom.path() });
  return schema;
};

export const localGitMiddleware = function({ repoPath }: { repoPath: string }) {
  // const client = simpleGit(repoPath);
  return async function(req: express.Request, res: express.Response) {
    const { body } = req;
    res.setHeader('Content-Type', 'application/json');

    switch (body.action) {
      case 'getMedia': {
        const files = await listFiles(path.join(repoPath, body.params.mediaFolder));
        res.send(JSON.stringify(files));
        break;
      }
      default: {
        const message = `Unknown action ${body.action}`;
        res.status(422).json({ error: message });
        break;
      }
    }
  };
};
