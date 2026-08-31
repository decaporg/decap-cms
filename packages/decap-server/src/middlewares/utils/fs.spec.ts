jest.unmock('path');

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { readMediaFile } from './entries';
import { deleteFile, writeFile } from './fs';

describe('repository filesystem boundary', () => {
  let temporaryPath: string;
  let repoPath: string;
  let outsidePath: string;

  beforeEach(async () => {
    temporaryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'decap-server-'));
    repoPath = path.join(temporaryPath, 'repo');
    outsidePath = path.join(temporaryPath, 'repo-owned');
    await Promise.all([fs.mkdir(repoPath), fs.mkdir(outsidePath)]);
  });

  afterEach(async () => {
    await fs.rmdir(temporaryPath, { recursive: true });
  });

  it('blocks reads, writes, and deletes through a sibling-prefix traversal', async () => {
    const traversalPath = path.join('..', 'repo-owned', 'secret.txt');
    const outsideFile = path.join(outsidePath, 'secret.txt');
    await fs.writeFile(outsideFile, 'outside-proof');

    await expect(readMediaFile(repoPath, traversalPath)).rejects.toThrow(
      'Path must resolve under the configured repository',
    );
    await expect(writeFile(repoPath, traversalPath, 'changed')).rejects.toThrow(
      'Path must resolve under the configured repository',
    );
    await expect(deleteFile(repoPath, traversalPath)).rejects.toThrow(
      'Path must resolve under the configured repository',
    );
    await expect(fs.readFile(outsideFile, 'utf8')).resolves.toBe('outside-proof');
  });

  it('blocks reads, writes, and deletes through a repository symlink', async () => {
    const linkPath = path.join(repoPath, 'linked');
    await fs.symlink(outsidePath, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    await fs.writeFile(path.join(outsidePath, 'secret.txt'), 'outside-proof');
    await fs.writeFile(path.join(outsidePath, 'delete-me.txt'), 'keep-me');

    await expect(readMediaFile(repoPath, 'linked/secret.txt')).rejects.toThrow(
      'Path must resolve under the configured repository',
    );
    await expect(writeFile(repoPath, 'linked/write.txt', 'changed')).rejects.toThrow(
      'Path must resolve under the configured repository',
    );
    await expect(deleteFile(repoPath, 'linked/delete-me.txt')).rejects.toThrow(
      'Path must resolve under the configured repository',
    );
    await expect(fs.readFile(path.join(outsidePath, 'secret.txt'), 'utf8')).resolves.toBe(
      'outside-proof',
    );
    await expect(fs.readFile(path.join(outsidePath, 'delete-me.txt'), 'utf8')).resolves.toBe(
      'keep-me',
    );
    await expect(fs.stat(path.join(outsidePath, 'write.txt'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
