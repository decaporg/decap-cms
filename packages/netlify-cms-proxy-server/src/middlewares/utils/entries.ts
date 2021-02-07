import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

function sha256(buffer: Buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}

// normalize windows os path format
function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

export async function entriesFromFiles(
  repoPath: string,
  files: { path: string; label?: string }[],
) {
  return Promise.all(
    files.map(async file => {
      try {
        const content = await fs.readFile(path.join(repoPath, file.path));
        return {
          data: content.toString(),
          file: { path: normalizePath(file.path), label: file.label, id: sha256(content) },
        };
      } catch (e) {
        return {
          data: null,
          file: { path: normalizePath(file.path), label: file.label, id: null },
        };
      }
    }),
  );
}

export async function readMediaFile(repoPath: string, file: string) {
  const encoding = 'base64';
  const buffer = await fs.readFile(path.join(repoPath, file));
  const id = sha256(buffer);

  return {
    id,
    content: buffer.toString(encoding),
    encoding,
    path: normalizePath(file),
    name: path.basename(file),
  };
}
