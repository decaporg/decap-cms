import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

const sha256 = (buffer: Buffer) => {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
};

export const entriesFromFiles = async (repoPath: string, files: string[]) => {
  return Promise.all(
    files.map(async file => {
      try {
        const content = await fs.readFile(path.join(repoPath, file));
        return {
          data: content.toString(),
          file: { path: file, id: sha256(content) },
        };
      } catch (e) {
        return { data: null, file: { path: file, id: null } };
      }
    }),
  );
};

export const readMediaFile = async (repoPath: string, file: string) => {
  const encoding = 'base64';
  const buffer = await fs.readFile(path.join(repoPath, file));
  const id = sha256(buffer);

  return {
    id,
    content: buffer.toString(encoding),
    encoding,
    path: file,
    name: path.basename(file),
  };
};
