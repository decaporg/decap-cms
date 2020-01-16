import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import Joi from '@hapi/joi';
import { parseContentKey, CMS_BRANCH_PREFIX } from 'netlify-cms-lib-util';

import { defaultSchema } from '../joi/joi';
import {
  EntriesByFolderParams,
  EntriesByFilesParams,
  GetEntryParams,
  DefaultParams,
} from '../types';
import simpleGit = require('simple-git/promise');

const sha256 = (buffer: Buffer) => {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
};

const runOnBranch = async <T>(git: simpleGit.SimpleGit, branch: string, func: () => Promise<T>) => {
  const currentBranch = await git.branchLocal().then(summary => summary.current);
  try {
    await git.checkout(branch);
    const result = await func();
    return result;
  } finally {
    await git.checkout(currentBranch);
  }
};

const listFiles = async (dir: string, extension: string, depth: number): Promise<string[]> => {
  if (depth <= 0) {
    return [];
  }
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.join(dir, dirent.name);
      return dirent.isDirectory()
        ? listFiles(res, extension, depth - 1)
        : [res].filter(f => f.endsWith(extension));
    }),
  );
  return files.flat();
};

const entriesFromFiles = async (files: string[]) => {
  return Promise.all(
    files.map(async file => {
      const content = await fs.readFile(file);
      return {
        data: content.toString(),
        file: { path: file, id: sha256(content) },
      };
    }),
  );
};

const getEntryDataFromDiff = (branch: string, diff: string[]) => {
  const contentKey = branch.substr(CMS_BRANCH_PREFIX.length);
  const { collection, slug } = parseContentKey(contentKey);
  const path = diff.find(d => d.includes(slug)) as string;
  const mediaFiles = diff.filter(d => d !== path);
  const status = 'draft';

  return {
    slug,
    metaData: { branch, collection, objects: { entry: { path, mediaFiles } }, status },
  };
};

type Options = {
  repoPath: string;
};

export const getSchema = ({ repoPath }: Options) => {
  const custom = Joi.extend({
    type: 'path',
    base: Joi.string().required(),
    messages: {
      'path.invalid': '{{#label}} must resolve to a path under the configured repository',
    },
    validate(value, helpers) {
      const resolvedPath = path.join(repoPath, value);
      if (!resolvedPath.startsWith(repoPath)) {
        return { value, errors: helpers.error('path.invalid') };
      }
    },
  });
  const schema = defaultSchema({ path: custom.path() });
  return schema;
};

export const localGitMiddleware = function({ repoPath }: Options) {
  const git = simpleGit(repoPath);

  return async function(req: express.Request, res: express.Response) {
    const { body } = req;
    const { branch } = body.payload as DefaultParams;

    switch (body.action) {
      case 'entriesByFolder': {
        const payload = body.params as EntriesByFolderParams;
        const { folder, extension, depth } = payload;
        const entries = await runOnBranch(git, branch, () =>
          listFiles(path.join(repoPath, folder), extension, depth).then(entriesFromFiles),
        );
        res.json(entries);
        break;
      }
      case 'entriesByFiles': {
        const payload = body.params as EntriesByFilesParams;
        const entries = await runOnBranch(git, branch, () =>
          entriesFromFiles(payload.files.map(file => path.join(repoPath, file.path))),
        );
        res.json(entries);
        break;
      }
      case 'getEntry': {
        const payload = body.params as GetEntryParams;
        const [entry] = await runOnBranch(git, branch, () =>
          entriesFromFiles([path.join(repoPath, payload.path)]),
        );
        res.json(entry);
        break;
      }
      case 'unpublishedEntries': {
        const cmsBranches = await git
          .branchLocal()
          .then(result => result.all.filter(b => b.startsWith(`${CMS_BRANCH_PREFIX}/`)));

        const diffs = await Promise.all(
          cmsBranches.map(cmsBranch => git.diffSummary([branch, cmsBranch])),
        );
        const entries = [];
        for (let i = 0; i < diffs.length; i++) {
          const cmsBranch = cmsBranches[i];
          const diff = diffs[i];
          const data = getEntryDataFromDiff(
            cmsBranch,
            diff.files.map(f => f.file),
          );
          const entryPath = data.metaData.objects.entry.path;
          const [entry] = await runOnBranch(git, cmsBranch, () =>
            entriesFromFiles([path.join(repoPath, entryPath)]),
          );
          const rawDiff = await git.diff([branch, cmsBranch, entryPath]);
          entries.push({
            ...data,
            fileData: entry.data,
            isModification: !rawDiff.includes('new file'),
          });
        }
        res.json(entries);
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
