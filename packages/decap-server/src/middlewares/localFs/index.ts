import path from 'path';

import { defaultSchema, joi } from '../joi';
import { pathTraversal } from '../joi/customValidators';
import { listRepoFiles, deleteFile, writeFile, move } from '../utils/fs';
import { entriesFromFiles, readMediaFile } from '../utils/entries';

import type {
  EntriesByFolderParams,
  EntriesByFilesParams,
  GetEntryParams,
  PersistEntryParams,
  GetMediaParams,
  GetMediaFileParams,
  PersistMediaParams,
  DeleteFileParams,
  DeleteFilesParams,
  DataFile,
} from '../types';
import type express from 'express';
import type winston from 'winston';

type FsOptions = {
  repoPath: string;
  logger: winston.Logger;
};

export function localFsMiddleware({ repoPath, logger }: FsOptions) {
  return async function (req: express.Request, res: express.Response) {
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
          const { folder, extension, depth, options } = payload;
          
          const allFiles = await listRepoFiles(repoPath, folder, extension, depth);
          
          // Handle pagination if options are provided
          let files = allFiles;
          let cursor = undefined;
          
          if (options?.pagination && options.page && options.pageSize) {
            const page = options.page;
            const pageSize = options.pageSize;
            const count = allFiles.length;
            const pageCount = Math.ceil(count / pageSize);
            
            // Slice files for current page
            const startIndex = (page - 1) * pageSize;
            const endIndex = page * pageSize;
            files = allFiles.slice(startIndex, endIndex);
            
            // Create cursor metadata
            const actions = [];
            if (page > 1) {
              actions.push('prev', 'first');
            }
            if (page < pageCount) {
              actions.push('next', 'last');
            }
            
            cursor = {
              actions,
              meta: { page, count, pageSize, pageCount },
              data: { files: allFiles },
            };
          }
          
          const entries = await entriesFromFiles(
            repoPath,
            files.map(file => ({ path: file })),
          );
          
          // Attach cursor if pagination is enabled
          if (cursor) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (entries as any)[Symbol.for('cursor')] = cursor;
          }
          
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
          } = body.params as PersistEntryParams;
          await Promise.all(
            dataFiles.map(dataFile => writeFile(path.join(repoPath, dataFile.path), dataFile.raw)),
          );
          // save assets
          await Promise.all(
            assets.map(a =>
              writeFile(path.join(repoPath, a.path), Buffer.from(a.content, a.encoding)),
            ),
          );
          if (dataFiles.every(dataFile => dataFile.newPath)) {
            dataFiles.forEach(async dataFile => {
              await move(
                path.join(repoPath, dataFile.path),
                path.join(repoPath, dataFile.newPath!),
              );
            });
          }
          res.json({ message: 'entry persisted' });
          break;
        }
        case 'getMedia': {
          const { mediaFolder } = body.params as GetMediaParams;
          const files = await listRepoFiles(repoPath, mediaFolder, '', 1);
          const mediaFiles = await Promise.all(files.map(file => readMediaFile(repoPath, file)));
          res.json(mediaFiles);
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
          await writeFile(
            path.join(repoPath, asset.path),
            Buffer.from(asset.content, asset.encoding),
          );
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
    } catch (e) {
      logger.error(
        `Error handling ${JSON.stringify(req.body)}: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
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
  logger: winston.Logger;
};

export async function registerMiddleware(app: express.Express, options: Options) {
  const { logger } = options;
  const repoPath = path.resolve(process.env.GIT_REPO_DIRECTORY || process.cwd());
  app.post('/api/v1', joi(getSchema({ repoPath })));
  app.post('/api/v1', localFsMiddleware({ repoPath, logger }));
  logger.info(`Decap CMS File System Proxy Server configured with ${repoPath}`);
}
