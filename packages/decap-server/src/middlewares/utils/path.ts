import path from 'path';
import { promises as fs } from 'fs';

const invalidPathMessage = 'Path must resolve under the configured repository';

function assertPathUnderRoot(repoRoot: string, resolvedPath: string) {
  const relativePath = path.relative(repoRoot, resolvedPath);

  if (
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(invalidPathMessage);
  }
}

export function resolveRepoPath(repoPath: string, filePath: string) {
  const repoRoot = path.resolve(repoPath);
  const resolvedPath = path.resolve(repoRoot, filePath);
  assertPathUnderRoot(repoRoot, resolvedPath);

  return resolvedPath;
}

export async function resolveExistingRepoPath(repoPath: string, filePath: string) {
  const repoRoot = await fs.realpath(path.resolve(repoPath));
  const resolvedPath = await fs.realpath(resolveRepoPath(repoPath, filePath));
  assertPathUnderRoot(repoRoot, resolvedPath);

  return resolvedPath;
}

export async function resolveNewRepoPath(repoPath: string, filePath: string) {
  const repoRoot = await fs.realpath(path.resolve(repoPath));
  const resolvedPath = resolveRepoPath(repoPath, filePath);
  const missingSegments: string[] = [];
  let existingPath = resolvedPath;
  let realExistingPath: string | undefined;

  while (!realExistingPath) {
    try {
      await fs.lstat(existingPath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw e;
      }
      missingSegments.unshift(path.basename(existingPath));
      existingPath = path.dirname(existingPath);
      continue;
    }

    realExistingPath = await fs.realpath(existingPath);
  }

  assertPathUnderRoot(repoRoot, realExistingPath);

  return path.join(realExistingPath, ...missingSegments);
}
