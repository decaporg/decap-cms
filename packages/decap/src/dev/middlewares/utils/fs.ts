import path from 'path';
import { promises as fs } from 'fs';

import { isGitDirSegment, resolveExistingRepoPath, resolveNewRepoPath } from './path.js';

async function listFiles(dir: string, extension: string, depth: number): Promise<string[]> {
  if (depth <= 0) {
    return [];
  }

  try {
    const dirents = (await fs.readdir(dir, { withFileTypes: true })).filter(
      // Never list (and so never move) Git's own files, e.g. when an entry at
      // the repository root is renamed and its whole directory moves with it.
      dirent => !isGitDirSegment(dirent.name),
    );
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
  const repoRoot = await fs.realpath(path.resolve(repoPath));

  let resolvedFolder: string;
  try {
    resolvedFolder = await resolveExistingRepoPath(repoRoot, folder);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw e;
  }

  const files = await listFiles(resolvedFolder, extension, depth);
  return files.map(f => path.relative(repoRoot, f));
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
  const repoRoot = await fs.realpath(path.resolve(repoPath));
  const resolvedFrom = await resolveExistingRepoPath(repoPath, from);
  const resolvedTo = await resolveNewRepoPath(repoPath, to);
  const sourceDir = path.dirname(resolvedFrom);
  const destDir = path.dirname(resolvedTo);

  // Legacy behavior (subfolders: true, default): the entry's folder holds the
  // rest of the entry, such as its media, so the folder moves with it. List it
  // before the entry moves, as the remote backends do, so an entry moved into
  // a subfolder of its own folder isn't swept along a second time. Never sweep
  // the repository root: that would move every file in the repository.
  const siblings =
    hasSubfolders && sourceDir !== repoRoot && sourceDir !== destDir
      ? (await listFiles(sourceDir, '', 100)).filter(file => file !== resolvedFrom)
      : [];
  const siblingMoves = await Promise.all(
    siblings.map(async file => {
      const target = path.join(destDir, path.relative(sourceDir, file));
      return [file, await resolveNewRepoPath(repoPath, path.relative(repoRoot, target))];
    }),
  );

  await moveFile(resolvedFrom, resolvedTo);
  await Promise.all(siblingMoves.map(([file, target]) => moveFile(file, target)));
}

export async function getUpdateDate(repoPath: string, filePath: string) {
  try {
    return await fs
      .stat(await resolveExistingRepoPath(repoPath, filePath))
      .then(stat => stat.mtime);
  } catch (e) {
    return new Date();
  }
}
