import path from 'path';

import { entriesFromFiles, normalizePath, readMediaFile } from '@/dev-server/middlewares/utils/entries';
import { deleteFile, listRepoFiles, listRepoFolders, move, writeFile } from '@/dev-server/middlewares/utils/fs';
import { defaultSchema, validateRequest } from '@/dev-server/middlewares/validation';
import { pathTraversal } from '@/dev-server/middlewares/validation/customValidators';

import type { DevServerApp, DevServerRequest, DevServerResponse } from '@/dev-server/app';
import type {
  DataFile,
  DeleteFileParams,
  DeleteFilesParams,
  EntriesByFilesParams,
  EntriesByFolderParams,
  GetEntryParams,
  GetMediaFileParams,
  GetMediaParams,
  PersistEntryParams,
  PersistMediaParams,
} from '@/dev-server/middlewares/types';

type FsOptions = {
  repoPath: string,
  logger: Pick<Console, 'log' | 'info' | 'error' | 'warn' | 'debug'>,
};

export function localFsMiddleware({ repoPath, logger }: FsOptions) {
  return async function(req: DevServerRequest, res: DevServerResponse) {
    try {
      const { body } = req;

      switch (body.action) {
        case 'info': {
          res.json({
            repo: path.basename(repoPath),
            publish_modes: ['simple'],
            type: 'local_fs',
          });
          break;
        }
        case 'entriesByFolder': {
          const payload = body.params as EntriesByFolderParams;
          const { folder, extension, depth } = payload;
          const entries = await listRepoFiles(repoPath, folder, extension, depth).then(files =>
            entriesFromFiles(
              repoPath,
              files.map(file => ({ path: file })),
            )
          );
          res.json(entries);
          break;
        }
        case 'entriesByFiles': {
          const payload = body.params as EntriesByFilesParams;
          const entries = await entriesFromFiles(repoPath, payload.files);
          res.json(entries);
          break;
        }
        case 'getEntry': {
          const payload = body.params as GetEntryParams;
          const [entry] = await entriesFromFiles(repoPath, [{ path: payload.path }]);
          res.json(entry);
          break;
        }
        case 'persistEntry': {
          const {
            entry,
            dataFiles = [entry as DataFile],
            assets,
            options,
          } = body.params as PersistEntryParams;
          const hasSubfolders = options?.hasSubfolders !== false;
          await Promise.all(
            dataFiles.map(dataFile => writeFile(repoPath, dataFile.path, dataFile.raw)),
          );
          // save assets
          await Promise.all(
            assets.map(a => writeFile(repoPath, a.path, Buffer.from(a.content, a.encoding))),
          );
          if (dataFiles.every(dataFile => dataFile.newPath)) {
            dataFiles.forEach(async dataFile => {
              await move(repoPath, dataFile.path, dataFile.newPath!, hasSubfolders);
            });
          }
          res.json({ message: 'entry persisted' });
          break;
        }
        case 'getMedia': {
          const { mediaFolder, folderSupport } = body.params as GetMediaParams;
          const files = await listRepoFiles(repoPath, mediaFolder, '', 1);
          const mediaFiles = await Promise.all(files.map(file => readMediaFile(repoPath, file)));
          if (!folderSupport) {
            res.json(mediaFiles);
            break;
          }
          const folders = await listRepoFolders(repoPath, mediaFolder);
          const folderEntries = folders.map(folder => ({
            id: normalizePath(folder),
            name: path.basename(folder),
            path: normalizePath(folder),
            isDirectory: true,
          }));
          res.json([...mediaFiles, ...folderEntries]);
          break;
        }
        case 'getMediaFile': {
          const { path } = body.params as GetMediaFileParams;
          const mediaFile = await readMediaFile(repoPath, path);
          res.json(mediaFile);
          break;
        }
        case 'persistMedia': {
          const { asset } = body.params as PersistMediaParams;
          await writeFile(repoPath, asset.path, Buffer.from(asset.content, asset.encoding));
          const file = await readMediaFile(repoPath, asset.path);
          res.json(file);
          break;
        }
        case 'deleteFile': {
          const { path: filePath } = body.params as DeleteFileParams;
          await deleteFile(repoPath, filePath);
          res.json({ message: `deleted file ${filePath}` });
          break;
        }
        case 'deleteFiles': {
          const { paths } = body.params as DeleteFilesParams;
          await Promise.all(paths.map(filePath => deleteFile(repoPath, filePath)));
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
    } catch (e: unknown) {
      logger.error(
        `Error handling ${JSON.stringify(req.body)}: ${e instanceof Error ? e.message : 'Unknown error'}`,
      );
      res.status(500).json({ error: 'Unknown error' });
    }
  };
}

export function getSchema({ repoPath }: { repoPath: string }) {
  const schema = defaultSchema({ path: pathTraversal(repoPath) });
  return schema;
}

type Options = {
  logger: Pick<Console, 'log' | 'info' | 'error' | 'warn' | 'debug'>,
};

export function registerMiddleware(app: DevServerApp, options: Options) {
  const { logger } = options;
  const repoPath = path.resolve(process.env.GIT_REPO_DIRECTORY || process.cwd());
  app.post('/api/v1', validateRequest(getSchema({ repoPath })));
  app.post('/api/v1', localFsMiddleware({ repoPath, logger }));
  logger.info(`Decap CMS File System Proxy Server configured with ${repoPath}`);
}
