import path from 'path';
import { promises as fs } from 'fs';

const invalidPathMessage = 'Path must resolve under the configured repository';
const gitPathMessage = "Path must not point into the repository's .git directory";

/**
 * Whether a single path segment names the `.git` directory. Mirrors Git's own
 * checks: case-insensitive (macOS and Windows file systems), with the trailing
 * dots and spaces, NTFS alternate stream suffix and 8.3 short name that
 * Windows also resolves to `.git`.
 */
export function isGitDirSegment(segment: string) {
  const name = segment.toLowerCase();
  // Anchored at both ends with a single character class, so these stay linear
  // on long segments (a `[. ]+$` search backtracks on runs of spaces).
  return (
    (name.startsWith('.git') && /^[. ]*$/.test(name.slice(4))) ||
    name.startsWith('.git:') ||
    /^git~\d+$/.test(name)
  );
}

function assertPathUnderRoot(repoRoot: string, resolvedPath: string) {
  const relativePath = path.relative(repoRoot, resolvedPath);

  if (
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(invalidPathMessage);
  }

  // Git's config and hooks live under .git, so writing there runs commands
  // (a clean filter on the next `git add`, a hook on the next commit).
  if (relativePath.split(/[\\/]/).some(isGitDirSegment)) {
    throw new Error(gitPathMessage);
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
