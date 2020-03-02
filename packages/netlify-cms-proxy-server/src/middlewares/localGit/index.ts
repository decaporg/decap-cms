import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
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
  GetMediaFileParams,
} from '../types';
// eslint-disable-next-line import/default
import simpleGit from 'simple-git/promise';
import { pathTraversal } from '../joi/customValidators';
import { listRepoFiles, writeFile } from '../utils/fs';
import { entriesFromFiles, readMediaFile } from '../utils/entries';

const commit = async (git: simpleGit.SimpleGit, commitMessage: string, files: string[]) => {
  await git.add(files);
  await git.commit(commitMessage, files, {
    '--no-verify': true,
    '--no-gpg-sign': true,
  });
};

const getCurrentBranch = async (git: simpleGit.SimpleGit) => {
  const currentBranch = await git.branchLocal().then(summary => summary.current);
  return currentBranch;
};

const runOnBranch = async <T>(git: simpleGit.SimpleGit, branch: string, func: () => Promise<T>) => {
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
};

const branchDescription = (branch: string) => `branch.${branch}.description`;

const getEntryDataFromDiff = async (git: simpleGit.SimpleGit, branch: string, diff: string[]) => {
  const contentKey = contentKeyFromBranch(branch);
  const { collection, slug } = parseContentKey(contentKey);
  const path = diff.find(d => d.includes(slug)) as string;
  const mediaFiles = diff.filter(d => d !== path);
  const label = await git.raw(['config', branchDescription(branch)]);
  const status = label && labelToStatus(label.trim());

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
      entriesFromFiles(repoPath, [{ path: entryPath }]),
    );

    const rawDiff = await git.diff([branch, cmsBranch, '--', entryPath]);
    entries.push({
      ...data,
      ...entry,
      isModification: !rawDiff.includes('new file'),
    });
  }

  return entries;
};

const getEntryMediaFiles = async (
  git: simpleGit.SimpleGit,
  repoPath: string,
  cmsBranch: string,
  files: string[],
) => {
  const mediaFiles = await runOnBranch(git, cmsBranch, async () => {
    const serializedFiles = await Promise.all(files.map(file => readMediaFile(repoPath, file)));
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
  await writeFile(path.join(repoPath, entry.path), entry.raw);
  // save assets
  await Promise.all(
    assets.map(a => writeFile(path.join(repoPath, a.path), Buffer.from(a.content, a.encoding))),
  );
  // commits files
  await commit(git, commitMessage, [entry.path, ...assets.map(a => a.path)]);
};

const rebase = async (git: simpleGit.SimpleGit, branch: string) => {
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
};

const merge = async (git: simpleGit.SimpleGit, from: string, to: string) => {
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
};

const isBranchExists = async (git: simpleGit.SimpleGit, branch: string) => {
  const branchExists = await git.branchLocal().then(({ all }) => all.includes(branch));
  return branchExists;
};

export const validateRepo = async ({ repoPath }: Options) => {
  const git = simpleGit(repoPath).silent(false);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw Error(`${repoPath} is not a valid git repository`);
  }
};

export const getSchema = ({ repoPath }: Options) => {
  const schema = defaultSchema({ path: pathTraversal(repoPath) });
  return schema;
};

export const localGitMiddleware = ({ repoPath }: Options) => {
  const git = simpleGit(repoPath).silent(false);

  return async function(req: express.Request, res: express.Response) {
    try {
      const { body } = req;
      if (body.action === 'info') {
        res.json({
          repo: path.basename(repoPath),
          // eslint-disable-next-line @typescript-eslint/camelcase
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
          const branchExists = await isBranchExists(git, cmsBranch);
          if (branchExists) {
            const diff = await git.diffSummary([branch, cmsBranch]);
            const [entry] = await entriesFromDiffs(git, branch, repoPath, [cmsBranch], [diff]);
            const mediaFiles = await getEntryMediaFiles(
              git,
              repoPath,
              cmsBranch,
              entry.metaData.objects.entry.mediaFiles,
            );
            res.json({ ...entry, mediaFiles });
          } else {
            return res.status(404).json({ message: 'Not Found' });
          }
          break;
        }
        case 'deleteUnpublishedEntry': {
          const { collection, slug } = body.params as UnpublishedEntryParams;
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
            await runOnBranch(git, branch, async () => {
              const branchExists = await isBranchExists(git, cmsBranch);
              if (branchExists) {
                await git.checkout(cmsBranch);
              } else {
                await git.checkoutLocalBranch(cmsBranch);
              }
              await rebase(git, branch);
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
              await Promise.all(toDelete.map(f => fs.unlink(path.join(repoPath, f))));
              await commitEntry(git, repoPath, entry, assets, options.commitMessage);

              // add status for new entries
              if (!data.metaData.status) {
                const description = statusToLabel(options.status);
                await git.addConfig(branchDescription(cmsBranch), description);
              }
              // set path for new entries
              if (!data.metaData.objects.entry.path) {
                data.metaData.objects.entry.path = entry.path;
              }
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
            await commit(git, commitMessage, [asset.path]);
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
            await fs.unlink(path.join(repoPath, filePath));
            await commit(git, commitMessage, [filePath]);
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
    } catch (e) {
      console.error(`Error handling ${JSON.stringify(req.body)}: ${e.message}`);
      res.status(500).json({ error: 'Unknown error' });
    }
  };
};

export const registerMiddleware = async (app: express.Express) => {
  const repoPath = path.resolve(process.env.GIT_REPO_DIRECTORY || process.cwd());
  await validateRepo({ repoPath });
  app.post('/api/v1', joi(getSchema({ repoPath })));
  app.post('/api/v1', localGitMiddleware({ repoPath }));
  console.log(`Netlify CMS Git Proxy Server configured with ${repoPath}`);
};
