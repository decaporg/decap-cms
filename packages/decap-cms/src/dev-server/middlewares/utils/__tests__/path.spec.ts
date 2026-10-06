// These tests exercise the dev server's filesystem boundary, so they need the
// OS's real path semantics, not the POSIX mock from vitest.setup.ts (which
// breaks Windows drive-letter resolution).
vi.unmock('path');

import path from 'path';
import { describe, expect, it, vi } from 'vitest';

import { resolveRepoPath } from '@/dev-server/middlewares/utils/path';

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
