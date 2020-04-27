import express from 'express';
import path from 'path';
import { defaultSchema, joi } from '../joi';
import { pathTraversal } from '../joi/customValidators';
import {
  EntriesByFolderParams,
  EntriesByFilesParams,
  GetEntryParams,
  PersistEntryParams,
  GetMediaParams,
  GetMediaFileParams,
  PersistMediaParams,
  DeleteFileParams,
} from '../types';
import { listRepoFiles, deleteFile, writeFile, move } from '../utils/fs';
import { entriesFromFiles, readMediaFile } from '../utils/entries';

type Options = {
  repoPath: string;
};

export const localFsMiddleware = ({ repoPath }: Options) => {
  return async function(req: express.Request, res: express.Response) {
    try {
      const { body } = req;

      switch (body.action) {
        case 'info': {
          res.json({
            repo: path.basename(repoPath),
            // eslint-disable-next-line @typescript-eslint/camelcase
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
            ),
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
          const { entry, assets } = body.params as PersistEntryParams;
          await writeFile(path.join(repoPath, entry.path), entry.raw);
          // save assets
          await Promise.all(
            assets.map(a =>
              writeFile(path.join(repoPath, a.path), Buffer.from(a.content, a.encoding)),
            ),
          );
          if (entry.newPath) {
            await move(path.join(repoPath, entry.path), path.join(repoPath, entry.newPath));
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

export const getSchema = ({ repoPath }: Options) => {
  const schema = defaultSchema({ path: pathTraversal(repoPath) });
  return schema;
};

export const registerMiddleware = async (app: express.Express) => {
  const repoPath = path.resolve(process.env.GIT_REPO_DIRECTORY || process.cwd());
  app.post('/api/v1', joi(getSchema({ repoPath })));
  app.post('/api/v1', localFsMiddleware({ repoPath }));
  console.log(`Netlify CMS File System Proxy Server configured with ${repoPath}`);
};
