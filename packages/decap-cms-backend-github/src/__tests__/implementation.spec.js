import { Cursor, CURSOR_COMPATIBILITY_SYMBOL } from 'decap-cms-lib-util';

import GitHubImplementation from '../implementation';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('github backend implementation', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      open_authoring: false,
      api_root: 'https://api.github.com',
    },
  };

  const createObjectURL = jest.fn();
  global.URL = {
    createObjectURL,
  };

  createObjectURL.mockReturnValue('displayURL');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forkExists', () => {
    it('should return true when repo is fork and parent matches originRepo', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'login' });

      global.fetch = jest.fn().mockResolvedValue({
        // matching should be case-insensitive
        json: () => ({ fork: true, parent: { full_name: 'OWNER/REPO' } }),
      });

      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(true);

      expect(gitHubImplementation.currentUser).toHaveBeenCalledTimes(1);
      expect(gitHubImplementation.currentUser).toHaveBeenCalledWith({ token: 'token' });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/repos/login/repo', {
        method: 'GET',
        headers: {
          Authorization: 'token token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should return false when repo is not a fork', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'login' });

      global.fetch = jest.fn().mockResolvedValue({
        // matching should be case-insensitive
        json: () => ({ fork: false }),
      });

      expect.assertions(1);
      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(false);
    });

    it("should return false when parent doesn't match originRepo", async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'login' });

      global.fetch = jest.fn().mockResolvedValue({
        json: () => ({ fork: true, parent: { full_name: 'owner/other_repo' } }),
      });

      expect.assertions(1);
      await expect(gitHubImplementation.forkExists({ token: 'token' })).resolves.toBe(false);
    });
  });

  describe('persistMedia', () => {
    const persistFiles = jest.fn();
    const mockAPI = {
      persistFiles,
    };

    persistFiles.mockImplementation((_, files) => {
      files.forEach((file, index) => {
        file.sha = index;
      });
    });

    it('should persist media file', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const mediaFile = {
        fileObj: { size: 100, name: 'image.png' },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(gitHubImplementation.persistMedia(mediaFile, {})).resolves.toEqual({
        id: 0,
        name: 'image.png',
        size: 100,
        displayURL: 'displayURL',
        path: 'media/image.png',
      });

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(persistFiles).toHaveBeenCalledWith([], [mediaFile], {});
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledWith(mediaFile.fileObj);
    });

    it('should log and throw error on "persistFiles" error', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const error = new Error('failed to persist files');
      persistFiles.mockRejectedValue(error);

      const mediaFile = {
        value: 'image.png',
        fileObj: { size: 100 },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(gitHubImplementation.persistMedia(mediaFile)).rejects.toThrowError(error);

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledTimes(0);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(error);
    });
  });

  describe('unpublishedEntry', () => {
    const generateContentKey = jest.fn();
    const retrieveUnpublishedEntryData = jest.fn();

    const mockAPI = {
      generateContentKey,
      retrieveUnpublishedEntryData,
    };

    it('should return unpublished entry data', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;
      gitHubImplementation.loadEntryMediaFiles = jest
        .fn()
        .mockResolvedValue([{ path: 'image.png', id: 'sha' }]);

      generateContentKey.mockReturnValue('contentKey');

      const data = {
        collection: 'collection',
        slug: 'slug',
        status: 'draft',
        diffs: [],
        updatedAt: 'updatedAt',
      };
      retrieveUnpublishedEntryData.mockResolvedValue(data);

      const collection = 'posts';
      const slug = 'slug';
      await expect(gitHubImplementation.unpublishedEntry({ collection, slug })).resolves.toEqual(
        data,
      );

      expect(generateContentKey).toHaveBeenCalledTimes(1);
      expect(generateContentKey).toHaveBeenCalledWith('posts', 'slug');

      expect(retrieveUnpublishedEntryData).toHaveBeenCalledTimes(1);
      expect(retrieveUnpublishedEntryData).toHaveBeenCalledWith('contentKey');
    });
  });

  describe('entriesByFolder', () => {
    const listFiles = jest.fn();
    const readFile = jest.fn();
    const readFileMetadata = jest.fn(() => Promise.resolve({ author: '', updatedOn: '' }));

    const mockAPI = {
      listFiles,
      readFile,
      readFileMetadata,
      originRepoURL: 'originRepoURL',
    };

    it('should return entries and cursor', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const files = [];
      const count = 1501;
      for (let i = 0; i < count; i++) {
        const id = `${i}`.padStart(`${count}`.length, '0');
        files.push({
          id,
          path: `posts/post-${id}.md`,
        });
      }

      listFiles.mockResolvedValue(files);
      readFile.mockImplementation((path, id) => Promise.resolve(`${id}`));

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ data: id, file: { path, id, author: '', updatedOn: '' } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      expectedEntries[CURSOR_COMPATIBILITY_SYMBOL] = expectedCursor;

      const result = await gitHubImplementation.entriesByFolder('posts', 'md', 1);

      expect(result).toEqual(expectedEntries);
      expect(listFiles).toHaveBeenCalledTimes(1);
      expect(listFiles).toHaveBeenCalledWith('posts', { depth: 1, repoURL: 'originRepoURL' });
      expect(readFile).toHaveBeenCalledTimes(20);
    });
  });

  describe('traverseCursor', () => {
    const listFiles = jest.fn();
    const readFile = jest.fn((path, id) => Promise.resolve(`${id}`));
    const readFileMetadata = jest.fn(() => Promise.resolve({}));

    const mockAPI = {
      listFiles,
      readFile,
      originRepoURL: 'originRepoURL',
      readFileMetadata,
    };

    const files = [];
    const count = 1501;
    for (let i = 0; i < count; i++) {
      const id = `${i}`.padStart(`${count}`.length, '0');
      files.push({
        id,
        path: `posts/post-${id}.md`,
      });
    }

    it('should handle next action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(20, 40)
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['prev', 'first', 'next', 'last'],
        meta: { page: 2, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'next');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle prev action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['prev', 'first', 'next', 'last'],
        meta: { page: 2, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'prev');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle last action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(1500)
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['prev', 'first'],
        meta: { page: 76, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'last');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle first action', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const cursor = Cursor.create({
        actions: ['prev', 'first'],
        meta: { page: 76, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ data: id, file: { path, id } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      const result = await gitHubImplementation.traverseCursor(cursor, 'first');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });
  });

  describe('progressive loading', () => {
    it('should load entries in batches with progress logging', async () => {
      // Mock console.log to capture progress messages
      const originalConsoleLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      const gitHubImplementation = new GitHubImplementation({
        ...config,
        backend: {
          ...config.backend,
          use_graphql: true,
        },
      });

      // Create test data: 150 files (should load in 3 batches of 50)
      const files = Array.from({ length: 150 }, (_, i) => ({
        id: `sha-${i}`,
        type: 'blob',
        name: `file-${i}.md`,
        path: `content/posts/file-${i}.md`,
        size: 1000,
      }));

      const mockMetadata = { author: 'Test Author', updatedOn: '2024-01-01' };

      // Mock the API methods
      gitHubImplementation.api = {
        originRepoURL: 'owner/repo',
        listFiles: jest.fn().mockResolvedValue(files),
        batchReadFileMetadata: jest
          .fn()
          .mockImplementation(batch => Promise.resolve(Array(batch.length).fill(mockMetadata))),
        readFile: jest
          .fn()
          .mockImplementation(path => Promise.resolve(`# ${path}\n\nContent for ${path}`)),
      };

      // Call allEntriesByFolder
      const result = await gitHubImplementation.allEntriesByFolder('content/posts', 'md', 1);

      // Verify results
      expect(result).toHaveLength(150);
      expect(gitHubImplementation.api.listFiles).toHaveBeenCalledTimes(1);

      // Should have called batchReadFileMetadata 3 times (150 / 50 = 3 batches)
      // But actually it will be called 8 times because batch size for metadata is 20
      // and we process 50 entries at a time for loading
      // Batch 1: 50 files = 3 metadata batches (50/20 = 2.5 → 3)
      // Batch 2: 50 files = 3 metadata batches
      // Batch 3: 50 files = 3 metadata batches
      // Total: 8-9 calls
      expect(gitHubImplementation.api.batchReadFileMetadata).toHaveBeenCalled();

      // Verify progress logging (should log for first 2 batches, not the last)
      const progressLogs = logSpy.mock.calls.filter(call =>
        call[0]?.includes('[GitHub Backend] Loaded'),
      );
      expect(progressLogs.length).toBeGreaterThan(0);
      expect(progressLogs[0][0]).toContain('50/150');
      expect(progressLogs[1][0]).toContain('100/150');

      // Restore console.log
      console.log = originalConsoleLog;
    });

    it('should not log progress for small collections', async () => {
      const originalConsoleLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      const gitHubImplementation = new GitHubImplementation({
        ...config,
        backend: {
          ...config.backend,
          use_graphql: true,
        },
      });

      // Create small collection: 25 files (only 1 batch)
      const files = Array.from({ length: 25 }, (_, i) => ({
        id: `sha-${i}`,
        type: 'blob',
        name: `file-${i}.md`,
        path: `content/file-${i}.md`,
        size: 1000,
      }));

      const mockMetadata = { author: 'Test Author', updatedOn: '2024-01-01' };

      gitHubImplementation.api = {
        originRepoURL: 'owner/repo',
        listFiles: jest.fn().mockResolvedValue(files),
        batchReadFileMetadata: jest
          .fn()
          .mockImplementation(batch => Promise.resolve(Array(batch.length).fill(mockMetadata))),
        readFile: jest.fn().mockImplementation(path => Promise.resolve(`# ${path}\n\nContent`)),
      };

      await gitHubImplementation.allEntriesByFolder('content', 'md', 1);

      // Should not have any progress logs (only 1 batch)
      const progressLogs = logSpy.mock.calls.filter(call =>
        call[0]?.includes('[GitHub Backend] Loaded'),
      );
      expect(progressLogs.length).toBe(0);

      console.log = originalConsoleLog;
    });
  });
});
