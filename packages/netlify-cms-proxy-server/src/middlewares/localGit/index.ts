import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import Joi from '@hapi/joi';
import {
  parseContentKey,
  branchFromContentKey,
  generateContentKey,
  contentKeyFromBranch,
  CMS_BRANCH_PREFIX,
  statusToLabel,
  labelToStatus,
} from 'netlify-cms-lib-util/src/API';

import { defaultSchema, joi } from '../joi';
import {
  EntriesByFolderParams,
  EntriesByFilesParams,
  GetEntryParams,
  DefaultParams,
  UnpublishedEntryParams,
  PersistEntryParams,
  GetMediaParams,
  Asset,
  PublishUnpublishedEntryParams,
  PersistMediaParams,
  DeleteFileParams,
  UpdateUnpublishedEntryStatusParams,
  Entry,
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

const branchDescription = (branch: string) => `branch.${branch}.description`;

const getEntryDataFromDiff = async (git: simpleGit.SimpleGit, branch: string, diff: string[]) => {
  const contentKey = contentKeyFromBranch(branch);
  const { collection, slug } = parseContentKey(contentKey);
  const path = diff.find(d => d.includes(slug)) as string;
  const mediaFiles = diff.filter(d => d !== path);
  const label = await git.raw(['config', branchDescription(branch)]);
  const status = labelToStatus(label);

  return {
    slug,
    metaData: { branch, collection, objects: { entry: { path, mediaFiles } }, status },
  };
};

type Options = {
  repoPath: string;
};

const entriesFromDiffs = async (
  git: simpleGit.SimpleGit,
  branch: string,
  repoPath: string,
  cmsBranches: string[],
  diffs: simpleGit.DiffResult[],
) => {
  const entries = [];
  for (let i = 0; i < diffs.length; i++) {
    const cmsBranch = cmsBranches[i];
    const diff = diffs[i];
    const data = await getEntryDataFromDiff(
      git,
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

  return entries;
};

const readMediaFile = async (file: string) => {
  const encoding = 'base64';
  const buffer = await fs.readFile(file);
  const id = sha256(buffer);

  return {
    id,
    content: buffer.toString(encoding),
    encoding,
    path: file,
    name: path.basename(file),
  };
};

const getEntryMediaFiles = async (
  git: simpleGit.SimpleGit,
  repoPath: string,
  cmsBranch: string,
  files: string[],
) => {
  const mediaFiles = await runOnBranch(git, cmsBranch, async () => {
    const serializedFiles = await Promise.all(
      files.map(f => readMediaFile(path.join(repoPath, f))),
    );
    return serializedFiles;
  });
  return mediaFiles;
};

const commitEntry = async (
  git: simpleGit.SimpleGit,
  repoPath: string,
  entry: Entry,
  assets: Asset[],
  commitMessage: string,
) => {
  // save entry content
  await fs.writeFile(path.join(repoPath, entry.path), entry.raw);
  // save assets
  await Promise.all(
    assets.map(a => fs.writeFile(path.join(a.path), Buffer.from(a.content, a.encoding))),
  );
  // add files and commit
  await git.add([entry.path, ...assets.map(a => a.path)]);
  await git.commit(commitMessage);
};

export const validateRepo = async ({ repoPath }: Options) => {
  const git = simpleGit(repoPath).silent(false);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw Error(`${repoPath} is not a valid git repository`);
  }
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

export const localGitMiddleware = ({ repoPath }: Options) => {
  const git = simpleGit(repoPath).silent(false);

  return async function(req: express.Request, res: express.Response) {
    const { body } = req;
    const { branch } = body.params as DefaultParams;

    const branchExists = await git.branchLocal().then(({ all }) => all.includes(branch));
    if (!branchExists) {
      const message = `Default branch '${branch}' doesn't exist`;
      res.status(422).json({ error: message });
      return;
    }

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
        const entries = await entriesFromDiffs(git, branch, repoPath, cmsBranches, diffs);
        res.json(entries);
        break;
      }
      case 'unpublishedEntry': {
        const { collection, slug } = body.params as UnpublishedEntryParams;
        const contentKey = generateContentKey(collection, slug);
        const cmsBranch = branchFromContentKey(contentKey);
        const diff = await git.diffSummary([branch, cmsBranch]);
        const [entry] = await entriesFromDiffs(git, branch, repoPath, [cmsBranch], [diff]);
        const mediaFiles = await getEntryMediaFiles(
          git,
          repoPath,
          cmsBranch,
          entry.metaData.objects.entry.mediaFiles,
        );
        res.json({ ...entry, mediaFiles });
        break;
      }
      case 'deleteUnpublishedEntry': {
        const { collection, slug } = body.params as UnpublishedEntryParams;
        const contentKey = generateContentKey(collection, slug);
        const cmsBranch = branchFromContentKey(contentKey);
        await git.deleteLocalBranch(cmsBranch);
        res.json({ message: `deleted branch: ${cmsBranch}` });
        break;
      }
      case 'persistEntry': {
        const { entry, assets, options } = body.params as PersistEntryParams;
        if (!options.useWorkflow) {
          runOnBranch(git, branch, async () => {
            await commitEntry(git, repoPath, entry, assets, options.commitMessage);
          });
        } else {
          const slug = entry.slug;
          const collection = options.collectionName as string;
          const contentKey = generateContentKey(collection, slug);
          const cmsBranch = branchFromContentKey(contentKey);
          runOnBranch(git, branch, async () => {
            await git.checkoutLocalBranch(cmsBranch);
            await git.rebase([branch]);
            const diff = await git.diffSummary([branch, cmsBranch]);
            const data = await getEntryDataFromDiff(
              git,
              branch,
              diff.files.map(f => f.file),
            );
            // delete media files that have been removed from the entry
            const toDelete = data.metaData.objects.entry.mediaFiles.filter(
              f => !assets.map(a => a.path).includes(f),
            );
            await Promise.all(toDelete.map(f => git.rm(path.join(repoPath, f))));
            await commitEntry(git, repoPath, entry, assets, options.commitMessage);
          });
        }
        res.json({ message: 'entry persisted' });
        break;
      }
      case 'updateUnpublishedEntryStatus': {
        const { collection, slug, newStatus } = body.params as UpdateUnpublishedEntryStatusParams;
        const contentKey = generateContentKey(collection, slug);
        const cmsBranch = branchFromContentKey(contentKey);
        const description = statusToLabel(newStatus);
        await git.addConfig(branchDescription(cmsBranch), description);
        res.json({ message: `${branch} description was updated to ${description}` });
        break;
      }
      case 'publishUnpublishedEntry': {
        const { collection, slug } = body.params as PublishUnpublishedEntryParams;
        const contentKey = generateContentKey(collection, slug);
        const cmsBranch = branchFromContentKey(contentKey);
        await git.mergeFromTo(cmsBranch, branch);
        await git.deleteLocalBranch(cmsBranch);
        res.json({ message: `branch ${cmsBranch} merged to ${branch}` });
        break;
      }
      case 'getMedia': {
        const { mediaFolder } = body.params as GetMediaParams;
        const mediaFiles = await runOnBranch(git, branch, async () => {
          const files = await listFiles(mediaFolder, '', 1);
          const serializedFiles = await Promise.all(
            files.map(file => readMediaFile(path.join(repoPath, file))),
          );
          return serializedFiles;
        });
        res.json(mediaFiles);
        break;
      }
      case 'persistMedia': {
        const {
          asset,
          options: { commitMessage },
        } = body.params as PersistMediaParams;
        await runOnBranch(git, branch, async () => {
          await fs.writeFile(path.join(asset.path), Buffer.from(asset.content, asset.encoding));
          await git.add(asset.path);
          await git.commit(commitMessage);
        });
        res.json({ message: `media persisted to ${asset.path}` });
        break;
      }
      case 'deleteFile': {
        const {
          path: filePath,
          options: { commitMessage },
        } = body.params as DeleteFileParams;
        await runOnBranch(git, branch, async () => {
          await git.rm(path.join(repoPath, filePath));
          await git.commit(commitMessage);
        });
        res.json({ message: `deleted file ${filePath}` });
        break;
      }
      case 'getDeployPreview': {
        res.json(null);
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

export const registerMiddleware = async (app: express.Express) => {
  const repoPath = path.resolve(process.env.GIT_REPO_DIRECTORY || process.cwd());
  await validateRepo({ repoPath });
  app.post('/api/v1', joi(getSchema({ repoPath })));
  app.post('/api/v1', localGitMiddleware({ repoPath }));
  console.log(`Netlify CMS Proxy Server configured with ${repoPath}`);
};
