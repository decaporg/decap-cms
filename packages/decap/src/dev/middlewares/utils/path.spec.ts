import path from 'path';

import { isGitDirSegment, resolveRepoPath } from './path.js';

describe('resolveRepoPath', () => {
  const repoPath = path.resolve('projects', 'repo');

  it('resolves paths within the repository', () => {
    expect(resolveRepoPath(repoPath, 'content/posts/post.md')).toBe(
      path.join(repoPath, 'content', 'posts', 'post.md'),
    );
  });

  it('rejects sibling paths that share the repository prefix', () => {
    expect(() => resolveRepoPath(repoPath, path.join('..', 'repo-owned', 'secret.txt'))).toThrow(
      'Path must resolve under the configured repository',
    );
  });

  it('rejects absolute paths outside the repository', () => {
    const outsidePath = path.resolve(repoPath, '..', 'outside', 'secret.txt');

    expect(() => resolveRepoPath(repoPath, outsidePath)).toThrow(
      'Path must resolve under the configured repository',
    );
  });
});

describe('the .git directory', () => {
  const repoPath = path.resolve('projects', 'repo');

  it.each([
    '.git/config',
    '.git/hooks/pre-commit',
    '.GIT/config',
    'content/../.git/config',
    'themes/theme/.git/config',
    '.git./config',
    '.git /config',
    '.git::$INDEX_ALLOCATION/config',
    'GIT~1/config',
    '.git',
  ])('rejects %s', filePath => {
    expect(() => resolveRepoPath(repoPath, filePath)).toThrow(
      "Path must not point into the repository's .git directory",
    );
  });

  it.each(['.github/workflows/deploy.yml', '.gitignore', '.gitattributes', 'content/git.md'])(
    'allows %s',
    filePath => {
      expect(() => resolveRepoPath(repoPath, filePath)).not.toThrow();
    },
  );

  it('matches only whole segments', () => {
    expect(isGitDirSegment('.git')).toBe(true);
    expect(isGitDirSegment('.gitkeep')).toBe(false);
  });
});
