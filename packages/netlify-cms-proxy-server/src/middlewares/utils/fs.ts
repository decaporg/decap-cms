import path from 'path';
import { promises as fs } from 'fs';

async function listFiles(dir: string, extension: string, depth: number): Promise<string[]> {
  if (depth <= 0) {
    return [];
  }

  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(dirent => {
        const res = path.join(dir, dirent.name);
        return dirent.isDirectory()
          ? listFiles(res, extension, depth - 1)
          : [res].filter(f => f.endsWith(extension));
      }),
    );
    return ([] as string[]).concat(...files);
  } catch (e) {
    return [];
  }
}

export async function listRepoFiles(
  repoPath: string,
  folder: string,
  extension: string,
  depth: number,
) {
  const files = await listFiles(path.join(repoPath, folder), extension, depth);
  return files.map(f => f.substr(repoPath.length + 1));
}

export async function writeFile(filePath: string, content: Buffer | string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

export async function deleteFile(repoPath: string, filePath: string) {
  await fs.unlink(path.join(repoPath, filePath)).catch(() => undefined);
}

async function moveFile(from: string, to: string) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
}

export async function move(from: string, to: string) {
  // move file
  await moveFile(from, to);

  // move children
  const sourceDir = path.dirname(from);
  const destDir = path.dirname(to);
  const allFiles = await listFiles(sourceDir, '', 100);
  await Promise.all(allFiles.map(file => moveFile(file, file.replace(sourceDir, destDir))));
}

export async function getUpdateDate(repoPath: string, filePath: string) {
  return fs
    .stat(path.join(repoPath, filePath))
    .then(stat => stat.mtime)
    .catch(() => new Date());
}
