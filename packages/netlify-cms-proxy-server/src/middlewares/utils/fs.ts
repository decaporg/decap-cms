import path from 'path';
import { promises as fs } from 'fs';

const listFiles = async (dir: string, extension: string, depth: number): Promise<string[]> => {
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
};

export const listRepoFiles = async (
  repoPath: string,
  folder: string,
  extension: string,
  depth: number,
) => {
  const files = await listFiles(path.join(repoPath, folder), extension, depth);
  return files.map(f => f.substr(repoPath.length + 1));
};

export const writeFile = async (filePath: string, content: Buffer | string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
};

export const deleteFile = async (repoPath: string, filePath: string) => {
  await fs.unlink(path.join(repoPath, filePath));
};
