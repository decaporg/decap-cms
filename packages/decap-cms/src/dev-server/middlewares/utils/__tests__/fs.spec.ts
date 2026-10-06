import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readMediaFile } from '@/dev-server/middlewares/utils/entries';
import { deleteFile, listRepoFiles, listRepoFolders, move, writeFile } from '@/dev-server/middlewares/utils/fs';

describe('dev-server fs utils', () => {
  let repoPath: string;

  beforeEach(async () => {
    repoPath = await fs.mkdtemp(path.join(os.tmpdir(), 'decap-cms-fs-utils-'));
  });

  afterEach(async () => {
    await fs.rm(repoPath, { recursive: true, force: true });
  });

  describe('listRepoFiles', () => {
    it('filters results by extension', async () => {
      await fs.writeFile(path.join(repoPath, 'a.md'), '');
      await fs.writeFile(path.join(repoPath, 'b.txt'), '');

      const files = await listRepoFiles(repoPath, '', '.md', 10);

      expect(files).toEqual(['a.md']);
    });

    it('returns an empty array when depth is 0', async () => {
      await fs.writeFile(path.join(repoPath, 'a.md'), '');

      const files = await listRepoFiles(repoPath, '', '.md', 0);

      expect(files).toEqual([]);
    });

    it('recurses into nested directories up to the given depth', async () => {
      await fs.mkdir(path.join(repoPath, 'nested', 'deeper'), { recursive: true });
      await fs.writeFile(path.join(repoPath, 'top.md'), '');
      await fs.writeFile(path.join(repoPath, 'nested', 'mid.md'), '');
      await fs.writeFile(path.join(repoPath, 'nested', 'deeper', 'bottom.md'), '');

      const files = await listRepoFiles(repoPath, '', '.md', 10);

      expect(files.sort()).toEqual(
        ['top.md', path.join('nested', 'mid.md'), path.join('nested', 'deeper', 'bottom.md')].sort(),
      );
    });

    it('stops recursing once the depth cutoff is reached', async () => {
      await fs.mkdir(path.join(repoPath, 'nested', 'deeper'), { recursive: true });
      await fs.writeFile(path.join(repoPath, 'nested', 'mid.md'), '');
      await fs.writeFile(path.join(repoPath, 'nested', 'deeper', 'bottom.md'), '');

      const files = await listRepoFiles(repoPath, '', '.md', 1);

      expect(files).toEqual([]);
    });

    it('strips the repoPath prefix from returned paths', async () => {
      await fs.mkdir(path.join(repoPath, 'content'), { recursive: true });
      await fs.writeFile(path.join(repoPath, 'content', 'post.md'), '');

      const files = await listRepoFiles(repoPath, '', '.md', 10);

      expect(files).toEqual([path.join('content', 'post.md')]);
      files.forEach(file => expect(path.isAbsolute(file)).toBe(false));
    });

    it('lists files under the given folder relative to repoPath', async () => {
      await fs.mkdir(path.join(repoPath, 'content'), { recursive: true });
      await fs.writeFile(path.join(repoPath, 'content', 'post.md'), '');
      await fs.writeFile(path.join(repoPath, 'other.md'), '');

      const files = await listRepoFiles(repoPath, 'content', '.md', 10);

      expect(files).toEqual([path.join('content', 'post.md')]);
    });

    it('returns an empty array for a non-existent folder', async () => {
      const files = await listRepoFiles(repoPath, 'does-not-exist', '.md', 10);

      expect(files).toEqual([]);
    });
  });

  describe('listRepoFolders', () => {
    it('returns only directories, excluding files', async () => {
      await fs.mkdir(path.join(repoPath, 'posts'));
      await fs.mkdir(path.join(repoPath, 'pages'));
      await fs.writeFile(path.join(repoPath, 'README.md'), '');

      const folders = await listRepoFolders(repoPath, '');

      expect(folders.sort()).toEqual(['pages', 'posts'].sort());
    });

    it('returns folder paths joined with the given folder argument', async () => {
      await fs.mkdir(path.join(repoPath, 'content', 'posts'), { recursive: true });
      await fs.mkdir(path.join(repoPath, 'content', 'pages'), { recursive: true });

      const folders = await listRepoFolders(repoPath, 'content');

      expect(folders.sort()).toEqual(
        [path.join('content', 'posts'), path.join('content', 'pages')].sort(),
      );
    });

    it('returns an empty array when there are no subdirectories', async () => {
      await fs.writeFile(path.join(repoPath, 'only-a-file.md'), '');

      const folders = await listRepoFolders(repoPath, '');

      expect(folders).toEqual([]);
    });

    it('returns an empty array for a non-existent folder', async () => {
      const folders = await listRepoFolders(repoPath, 'does-not-exist');

      expect(folders).toEqual([]);
    });
  });
});

describe('repository filesystem boundary', () => {
  const invalidPath = 'Path must resolve under the configured repository';
  let temporaryPath: string;
  let repoPath: string;
  let outsidePath: string;

  beforeEach(async () => {
    temporaryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'decap-cms-dev-server-'));
    repoPath = path.join(temporaryPath, 'repo');
    // Shares the repository's name as a prefix, so a naive
    // `startsWith(repoPath)` check would wrongly accept it.
    outsidePath = path.join(temporaryPath, 'repo-owned');
    await Promise.all([fs.mkdir(repoPath), fs.mkdir(outsidePath)]);
  });

  afterEach(async () => {
    await fs.rm(temporaryPath, { recursive: true, force: true });
  });

  it('blocks reads, writes, and deletes through a sibling-prefix traversal', async () => {
    const traversalPath = path.join('..', 'repo-owned', 'secret.txt');
    const outsideFile = path.join(outsidePath, 'secret.txt');
    await fs.writeFile(outsideFile, 'outside-proof');

    await expect(readMediaFile(repoPath, traversalPath)).rejects.toThrow(invalidPath);
    await expect(writeFile(repoPath, traversalPath, 'changed')).rejects.toThrow(invalidPath);
    await expect(deleteFile(repoPath, traversalPath)).rejects.toThrow(invalidPath);
    await expect(fs.readFile(outsideFile, 'utf8')).resolves.toBe('outside-proof');
  });

  it('blocks reads, writes, deletes, moves and listings through a repository symlink', async () => {
    const linkPath = path.join(repoPath, 'linked');
    await fs.symlink(outsidePath, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    await fs.writeFile(path.join(outsidePath, 'secret.txt'), 'outside-proof');
    await fs.writeFile(path.join(outsidePath, 'delete-me.txt'), 'keep-me');
    await fs.writeFile(path.join(repoPath, 'inside.md'), 'inside');

    await expect(readMediaFile(repoPath, 'linked/secret.txt')).rejects.toThrow(invalidPath);
    await expect(writeFile(repoPath, 'linked/write.txt', 'changed')).rejects.toThrow(invalidPath);
    await expect(deleteFile(repoPath, 'linked/delete-me.txt')).rejects.toThrow(invalidPath);
    await expect(move(repoPath, 'inside.md', 'linked/moved.md', false)).rejects.toThrow(invalidPath);
    await expect(listRepoFiles(repoPath, 'linked', '.txt', 10)).rejects.toThrow(invalidPath);

    await expect(fs.readFile(path.join(outsidePath, 'secret.txt'), 'utf8')).resolves.toBe('outside-proof');
    await expect(fs.readFile(path.join(outsidePath, 'delete-me.txt'), 'utf8')).resolves.toBe('keep-me');
    await expect(fs.stat(path.join(outsidePath, 'write.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.stat(path.join(outsidePath, 'moved.md'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.readFile(path.join(repoPath, 'inside.md'), 'utf8')).resolves.toBe('inside');
  });

  it('still writes, moves and lists files inside the repository', async () => {
    await writeFile(repoPath, 'content/posts/new.md', 'hello');
    await move(repoPath, 'content/posts/new.md', 'content/archive/new.md', false);

    await expect(listRepoFiles(repoPath, 'content', '.md', 10)).resolves.toEqual([
      path.join('content', 'archive', 'new.md'),
    ]);
  });

  it('lists nothing for a collection folder that does not exist yet', async () => {
    await expect(listRepoFiles(repoPath, 'content/not-created-yet', '.md', 10)).resolves.toEqual([]);
  });
});
