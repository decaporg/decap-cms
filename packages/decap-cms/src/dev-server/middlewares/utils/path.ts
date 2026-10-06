import { promises as fs } from 'fs';
import path from 'path';

export const INVALID_PATH_MESSAGE = 'Path must resolve under the configured repository';

function assertPathUnderRoot(repoRoot: string, resolvedPath: string) {
  const relativePath = path.relative(repoRoot, resolvedPath);

  if (
    relativePath === '..'
    || relativePath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativePath)
  ) {
    throw new Error(INVALID_PATH_MESSAGE);
  }
}

/**
 * Resolve `filePath` against the repository root, rejecting any path that
 * lexically escapes it (`../sibling`, absolute paths). Doesn't touch the
 * filesystem, so it can't see symlinks; use the async variants below before
 * reading or writing.
 */
export function resolveRepoPath(repoPath: string, filePath: string) {
  const repoRoot = path.resolve(repoPath);
  const resolvedPath = path.resolve(repoRoot, filePath);
  assertPathUnderRoot(repoRoot, resolvedPath);

  return resolvedPath;
}

/**
 * Resolve a path that must already exist, following symlinks, and reject it
 * if its real location is outside the repository's real location.
 */
export async function resolveExistingRepoPath(repoPath: string, filePath: string) {
  const repoRoot = await fs.realpath(path.resolve(repoPath));
  const resolvedPath = await fs.realpath(resolveRepoPath(repoPath, filePath));
  assertPathUnderRoot(repoRoot, resolvedPath);

  return resolvedPath;
}

/**
 * Resolve a path that may not exist yet (a file about to be written): follow
 * symlinks on the deepest existing ancestor and reject the path if that
 * ancestor's real location is outside the repository.
 */
export async function resolveNewRepoPath(repoPath: string, filePath: string) {
  const repoRoot = await fs.realpath(path.resolve(repoPath));
  const resolvedPath = resolveRepoPath(repoPath, filePath);
  const missingSegments: string[] = [];
  let existingPath = resolvedPath;
  let realExistingPath: string | undefined;

  while (!realExistingPath) {
    try {
      await fs.lstat(existingPath);
    } catch (e: unknown) {
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
