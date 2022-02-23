import path from 'path';
import { promises as fs } from 'fs';
import {
  branchFromContentKey,
  generateContentKey,
  contentKeyFromBranch,
  CMS_BRANCH_PREFIX,
  statusToLabel,
  labelToStatus,
  parseContentKey,
} from 'netlify-cms-lib-util/src/APIUtils';
import { parse } from 'what-the-diff';
import simpleGit from 'simple-git/promise';
import { Mutex, withTimeout } from 'async-mutex';

import { defaultSchema, joi } from '../joi';
import { pathTraversal } from '../joi/customValidators';
import { listRepoFiles, writeFile, move, deleteFile, getUpdateDate } from '../utils/fs';
import { entriesFromFiles, readMediaFile } from '../utils/entries';

import type {
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
  DataFile,
  GetMediaFileParams,
  DeleteEntryParams,
  DeleteFilesParams,
  UnpublishedEntryDataFileParams,
  UnpublishedEntryMediaFileParams,
} from '../types';
import type express from 'express';
import type winston from 'winston';

async function commit(git: simpleGit.SimpleGit, commitMessage: string) {
  await git.add('.');
  await git.commit(commitMessage, undefined, {
    // setting the value to a string passes name=value
    // any other value passes just the key
    '--no-verify': null,
    '--no-gpg-sign': null,
  });
}

async function getCurrentBranch(git: simpleGit.SimpleGit) {
  const currentBranch = await git.branchLocal().then(summary => summary.current);
  return currentBranch;
}

async function runOnBranch<T>(git: simpleGit.SimpleGit, branch: string, func: () => Promise<T>) {
  const currentBranch = await getCurrentBranch(git);
  try {
    if (currentBranch !== branch) {
      await git.checkout(branch);
    }
    const result = await func();
    return result;
  } finally {
    await git.checkout(currentBranch);
  }
}

function branchDescription(branch: string) {
  return `branch.${branch}.description`;
}

type GitOptions = {
  repoPath: string;
  logger: winston.Logger;
};

async function commitEntry(
  git: simpleGit.SimpleGit,
  repoPath: string,
  dataFiles: DataFile[],
  assets: Asset[],
  commitMessage: string,
) {
  // save entry content
  await Promise.all(
    dataFiles.map(dataFile => writeFile(path.join(repoPath, dataFile.path), dataFile.raw)),
  );
  // save assets
  await Promise.all(
    assets.map(a => writeFile(path.join(repoPath, a.path), Buffer.from(a.content, a.encoding))),
  );
  if (dataFiles.every(dataFile => dataFile.newPath)) {
    dataFiles.forEach(async dataFile => {
      await move(path.join(repoPath, dataFile.path), path.join(repoPath, dataFile.newPath!));
    });
  }

  // commits files
  await commit(git, commitMessage);
}

async function rebase(git: simpleGit.SimpleGit, branch: string) {
  const gpgSign = await git.raw(['config', 'commit.gpgsign']);
  try {
    if (gpgSign === 'true') {
      await git.addConfig('commit.gpgsign', 'false');
    }
    await git.rebase([branch, '--no-verify']);
  } finally {
    if (gpgSign === 'true') {
      await git.addConfig('commit.gpgsign', gpgSign);
    }
  }
}

async function merge(git: simpleGit.SimpleGit, from: string, to: string) {
  const gpgSign = await git.raw(['config', 'commit.gpgsign']);
  try {
    if (gpgSign === 'true') {
      await git.addConfig('commit.gpgsign', 'false');
    }
    await git.mergeFromTo(from, to);
  } finally {
    if (gpgSign === 'true') {
      await git.addConfig('commit.gpgsign', gpgSign);
    }
  }
}

async function isBranchExists(git: simpleGit.SimpleGit, branch: string) {
  const branchExists = await git.branchLocal().then(({ all }) => all.includes(branch));
  return branchExists;
}

async function getDiffs(git: simpleGit.SimpleGit, source: string, dest: string) {
  const rawDiff = await git.diff([source, dest]);
  const diffs = parse(rawDiff).map(d => {
    const oldPath = d.oldPath?.replace(/b\//, '') || '';
    const newPath = d.newPath?.replace(/b\//, '') || '';
    const path = newPath || (oldPath as string);
    return {
      oldPath,
      newPath,
      status: d.status,
      newFile: d.status === 'added',
      path,
      id: path,
      binary: d.binary || /.svg$/.test(path),
    };
  });
  return diffs;
}

export async function validateRepo({ repoPath }: { repoPath: string }) {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw Error(`${repoPath} is not a valid git repository`);
  }
}

export function getSchema({ repoPath }: { repoPath: string }) {
  const schema = defaultSchema({ path: pathTraversal(repoPath) });
  return schema;
}

export function localGitMiddleware({ repoPath, logger }: GitOptions) {
  const git = simpleGit(repoPath);

  // we can only perform a single git operation at any given time
  const mutex = withTimeout(new Mutex(), 3000, new Error('Request timed out'));

  return async function (req: express.Request, res: express.Response) {
    let release;
    try {
      release = await mutex.acquire();
      const { body } = req;
      if (body.action === 'info') {
        res.json({
          repo: path.basename(repoPath),
          publish_modes: ['simple', 'editorial_workflow'],
          type: 'local_git',
        });
        return;
      }
      const { branch } = body.params as DefaultParams;

      const branchExists = await isBranchExists(git, branch);
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
            listRepoFiles(repoPath, folder, extension, depth).then(files =>
              entriesFromFiles(
                repoPath,
                files.map(file => ({ path: file })),
              ),
            ),
          );
          res.json(entries);
          break;
        }
        case 'entriesByFiles': {
          const payload = body.params as EntriesByFilesParams;
          const entries = await runOnBranch(git, branch, () =>
            entriesFromFiles(repoPath, payload.files),
          );
          res.json(entries);
          break;
        }
        case 'getEntry': {
          const payload = body.params as GetEntryParams;
          const [entry] = await runOnBranch(git, branch, () =>
            entriesFromFiles(repoPath, [{ path: payload.path }]),
          );
          res.json(entry);
          break;
        }
        case 'unpublishedEntries': {
          const cmsBranches = await git
            .branchLocal()
            .then(result => result.all.filter(b => b.startsWith(`${CMS_BRANCH_PREFIX}/`)));
          res.json(cmsBranches.map(contentKeyFromBranch));
          break;
        }
        case 'unpublishedEntry': {
          let { id, collection, slug, cmsLabelPrefix } = body.params as UnpublishedEntryParams;
          if (id) {
            ({ collection, slug } = parseContentKey(id));
          }
          const contentKey = generateContentKey(collection as string, slug as string);
          const cmsBranch = branchFromContentKey(contentKey);
          const branchExists = await isBranchExists(git, cmsBranch);
          if (branchExists) {
            const diffs = await getDiffs(git, branch, cmsBranch);
            const label = await git.raw(['config', branchDescription(cmsBranch)]);
            const status = label && labelToStatus(label.trim(), cmsLabelPrefix || '');
            const updatedAt =
              diffs.length >= 0
                ? await runOnBranch(git, cmsBranch, async () => {
                    const dates = await Promise.all(
                      diffs.map(({ newPath }) => getUpdateDate(repoPath, newPath)),
                    );
                    return dates.reduce((a, b) => {
                      return a > b ? a : b;
                    });
                  })
                : new Date();
            const unpublishedEntry = {
              collection,
              slug,
              status,
              diffs,
              updatedAt,
            };
            res.json(unpublishedEntry);
          } else {
            return res.status(404).json({ message: 'Not Found' });
          }
          break;
        }
        case 'unpublishedEntryDataFile': {
          const { path, collection, slug } = body.params as UnpublishedEntryDataFileParams;
          const contentKey = generateContentKey(collection as string, slug as string);
          const cmsBranch = branchFromContentKey(contentKey);
          const [entry] = await runOnBranch(git, cmsBranch, () =>
            entriesFromFiles(repoPath, [{ path }]),
          );
          res.json({ data: entry.data });
          break;
        }
        case 'unpublishedEntryMediaFile': {
          const { path, collection, slug } = body.params as UnpublishedEntryMediaFileParams;
          const contentKey = generateContentKey(collection as string, slug as string);
          const cmsBranch = branchFromContentKey(contentKey);
          const file = await runOnBranch(git, cmsBranch, () => readMediaFile(repoPath, path));
          res.json(file);
          break;
        }
        case 'deleteUnpublishedEntry': {
          const { collection, slug } = body.params as DeleteEntryParams;
          const contentKey = generateContentKey(collection, slug);
          const cmsBranch = branchFromContentKey(contentKey);
          const currentBranch = await getCurrentBranch(git);
          if (currentBranch === cmsBranch) {
            await git.checkoutLocalBranch(branch);
          }
          await git.branch(['-D', cmsBranch]);
          res.json({ message: `deleted branch: ${cmsBranch}` });
          break;
        }
        case 'persistEntry': {
          const {
            cmsLabelPrefix,
            entry,
            dataFiles = [entry as DataFile],
            assets,
            options,
          } = body.params as PersistEntryParams;

          if (!options.useWorkflow) {
            await runOnBranch(git, branch, async () => {
              await commitEntry(git, repoPath, dataFiles, assets, options.commitMessage);
            });
          } else {
            const slug = dataFiles[0].slug;
            const collection = options.collectionName as string;
            const contentKey = generateContentKey(collection, slug);
            const cmsBranch = branchFromContentKey(contentKey);
            await runOnBranch(git, branch, async () => {
              const branchExists = await isBranchExists(git, cmsBranch);
              if (branchExists) {
                await git.checkout(cmsBranch);
              } else {
                await git.checkoutLocalBranch(cmsBranch);
              }
              await rebase(git, branch);
              const diffs = await getDiffs(git, branch, cmsBranch);
              // delete media files that have been removed from the entry
              const toDelete = diffs.filter(
                d => d.binary && !assets.map(a => a.path).includes(d.path),
              );
              await Promise.all(toDelete.map(f => fs.unlink(path.join(repoPath, f.path))));
              await commitEntry(git, repoPath, dataFiles, assets, options.commitMessage);

              // add status for new entries
              if (!branchExists) {
                const description = statusToLabel(options.status, cmsLabelPrefix || '');
                await git.addConfig(branchDescription(cmsBranch), description);
              }
            });
          }
          res.json({ message: 'entry persisted' });
          break;
        }
        case 'updateUnpublishedEntryStatus': {
          const { collection, slug, newStatus, cmsLabelPrefix } =
            body.params as UpdateUnpublishedEntryStatusParams;
          const contentKey = generateContentKey(collection, slug);
          const cmsBranch = branchFromContentKey(contentKey);
          const description = statusToLabel(newStatus, cmsLabelPrefix || '');
          await git.addConfig(branchDescription(cmsBranch), description);
          res.json({ message: `${branch} description was updated to ${description}` });
          break;
        }
        case 'publishUnpublishedEntry': {
          const { collection, slug } = body.params as PublishUnpublishedEntryParams;
          const contentKey = generateContentKey(collection, slug);
          const cmsBranch = branchFromContentKey(contentKey);
          await merge(git, cmsBranch, branch);
          await git.deleteLocalBranch(cmsBranch);
          res.json({ message: `branch ${cmsBranch} merged to ${branch}` });
          break;
        }
        case 'getMedia': {
          const { mediaFolder } = body.params as GetMediaParams;
          const mediaFiles = await runOnBranch(git, branch, async () => {
            const files = await listRepoFiles(repoPath, mediaFolder, '', 1);
            const serializedFiles = await Promise.all(
              files.map(file => readMediaFile(repoPath, file)),
            );
            return serializedFiles;
          });
          res.json(mediaFiles);
          break;
        }
        case 'getMediaFile': {
          const { path } = body.params as GetMediaFileParams;
          const mediaFile = await runOnBranch(git, branch, () => {
            return readMediaFile(repoPath, path);
          });
          res.json(mediaFile);
          break;
        }
        case 'persistMedia': {
          const {
            asset,
            options: { commitMessage },
          } = body.params as PersistMediaParams;

          const file = await runOnBranch(git, branch, async () => {
            await writeFile(
              path.join(repoPath, asset.path),
              Buffer.from(asset.content, asset.encoding),
            );
            await commit(git, commitMessage);
            return readMediaFile(repoPath, asset.path);
          });
          res.json(file);
          break;
        }
        case 'deleteFile': {
          const {
            path: filePath,
            options: { commitMessage },
          } = body.params as DeleteFileParams;
          await runOnBranch(git, branch, async () => {
            await deleteFile(repoPath, filePath);
            await commit(git, commitMessage);
          });
          res.json({ message: `deleted file ${filePath}` });
          break;
        }
        case 'deleteFiles': {
          const {
            paths,
            options: { commitMessage },
          } = body.params as DeleteFilesParams;
          await runOnBranch(git, branch, async () => {
            await Promise.all(paths.map(filePath => deleteFile(repoPath, filePath)));
            await commit(git, commitMessage);
          });
          res.json({ message: `deleted files ${paths.join(', ')}` });
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
    } catch (e) {
      logger.error(`Error handling ${JSON.stringify(req.body)}: ${e.message}`);
      res.status(500).json({ error: 'Unknown error' });
    } finally {
      release && release();
    }
  };
}

type Options = {
  logger: winston.Logger;
};

export async function registerMiddleware(app: express.Express, options: Options) {
  const { logger } = options;
  const repoPath = path.resolve(process.env.GIT_REPO_DIRECTORY || process.cwd());
  await validateRepo({ repoPath });
  app.post('/api/v1', joi(getSchema({ repoPath })));
  app.post('/api/v1', localGitMiddleware({ repoPath, logger }));
  logger.info(`Netlify CMS Git Proxy Server configured with ${repoPath}`);
}
