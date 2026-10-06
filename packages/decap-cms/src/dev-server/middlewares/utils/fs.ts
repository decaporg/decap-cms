import { promises as fs } from 'fs';
import path from 'path';

import { resolveExistingRepoPath, resolveNewRepoPath } from '@/dev-server/middlewares/utils/path';

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
  } catch (e: unknown) {
    return [];
  }
}

export async function listRepoFiles(
  repoPath: string,
  folder: string,
  extension: string,
  depth: number,
) {
  const repoRoot = await fs.realpath(path.resolve(repoPath));
  let folderPath: string;
  try {
    folderPath = await resolveExistingRepoPath(repoRoot, folder);
  } catch (e: unknown) {
    // A collection folder that doesn't exist yet has no entries. Anything
    // else (a folder that resolves outside the repository) is an error.
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw e;
  }
  const files = await listFiles(folderPath, extension, depth);
  return files.map(f => path.relative(repoRoot, f));
}

export async function listRepoFolders(repoPath: string, folder: string) {
  try {
    const folderPath = await resolveExistingRepoPath(repoPath, folder);
    const dirents = await fs.readdir(folderPath, { withFileTypes: true });
    return dirents.filter(dirent => dirent.isDirectory()).map(dirent => path.join(folder, dirent.name));
  } catch (e: unknown) {
    return [];
  }
}

export async function writeFile(repoPath: string, filePath: string, content: Buffer | string) {
  const resolvedPath = await resolveNewRepoPath(repoPath, filePath);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content);
}

export async function deleteFile(repoPath: string, filePath: string) {
  const resolvedPath = await resolveNewRepoPath(repoPath, filePath);
  await fs.unlink(resolvedPath).catch(() => undefined);
}

async function moveFile(from: string, to: string) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
}

export async function move(repoPath: string, from: string, to: string, hasSubfolders = true) {
  const resolvedFrom = await resolveExistingRepoPath(repoPath, from);
  const resolvedTo = await resolveNewRepoPath(repoPath, to);

  // move file
  await moveFile(resolvedFrom, resolvedTo);

  if (hasSubfolders) {
    // Legacy behavior (subfolders: true, default): move all files in the directory
    // This is for collections where all files in a folder represent a single entry
    const sourceDir = path.dirname(resolvedFrom);
    const destDir = path.dirname(resolvedTo);
    const allFiles = await listFiles(sourceDir, '', 100);
    await Promise.all(allFiles.map(file => moveFile(file, file.replace(sourceDir, destDir))));
  }
}

export async function getUpdateDate(repoPath: string, filePath: string) {
  try {
    const stat = await fs.stat(await resolveExistingRepoPath(repoPath, filePath));
    return stat.mtime;
  } catch (e: unknown) {
    return new Date();
  }
}
