import { Cursor, CURSOR_COMPATIBILITY_SYMBOL } from 'decap-cms-lib-util';

import ForgejoImplementation from '../implementation';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('forgejo backend implementation', () => {
  const config = {
    backend: {
      repo: 'owner/repo',
      api_root: 'https://v14.next.forgejo.org/api/v1',
    },
  };

  const createObjectURL = jest.fn();
  global.URL = {
    createObjectURL,
  };

  createObjectURL.mockReturnValue('displayURL');

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
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
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

      const mediaFile = {
        fileObj: { size: 100, name: 'image.png' },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(
        forgejoImplementation.persistMedia(mediaFile, { commitMessage: 'Persisting media' }),
      ).resolves.toEqual({
        id: 0,
        name: 'image.png',
        size: 100,
        displayURL: 'displayURL',
        path: 'media/image.png',
      });

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(persistFiles).toHaveBeenCalledWith([], [mediaFile], {
        commitMessage: 'Persisting media',
      });
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledWith(mediaFile.fileObj);
    });

    it('should log and throw error on "persistFiles" error', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

      const error = new Error('failed to persist files');
      persistFiles.mockRejectedValue(error);

      const mediaFile = {
        fileObj: { size: 100 },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(
        forgejoImplementation.persistMedia(mediaFile, { commitMessage: 'Persisting media' }),
      ).rejects.toThrowError(error);

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledTimes(0);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(error);
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
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

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
      readFile.mockImplementation((_path, id) => Promise.resolve(`${id}`));

      const expectedEntries = files
        .slice(0, 20)
        .map(({ id, path }) => ({ data: id, file: { path, id, author: '', updatedOn: '' } }));

      const expectedCursor = Cursor.create({
        actions: ['next', 'last'],
        meta: { page: 1, count, pageSize: 20, pageCount: 76 },
        data: { files },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expectedEntries[CURSOR_COMPATIBILITY_SYMBOL] = expectedCursor;

      const result = await forgejoImplementation.entriesByFolder('posts', 'md', 1);

      expect(result).toEqual(expectedEntries);
      expect(listFiles).toHaveBeenCalledTimes(1);
      expect(listFiles).toHaveBeenCalledWith('posts', { depth: 1, repoURL: 'originRepoURL' });
      expect(readFile).toHaveBeenCalledTimes(20);
    });
  });

  describe('traverseCursor', () => {
    const listFiles = jest.fn();
    const readFile = jest.fn((_path, id) => Promise.resolve(`${id}`));
    const readFileMetadata = jest.fn(() => Promise.resolve({}));

    const mockAPI = {
      listFiles,
      readFile,
      originRepoURL: 'originRepoURL',
      readFileMetadata,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

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

      const result = await forgejoImplementation.traverseCursor(cursor, 'next');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle prev action', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

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

      const result = await forgejoImplementation.traverseCursor(cursor, 'prev');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle last action', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

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

      const result = await forgejoImplementation.traverseCursor(cursor, 'last');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });

    it('should handle first action', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = mockAPI;

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

      const result = await forgejoImplementation.traverseCursor(cursor, 'first');

      expect(result).toEqual({
        entries: expectedEntries,
        cursor: expectedCursor,
      });
    });
  });

  describe('editorial workflow', () => {
    it('should list unpublished entries', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = {
        listUnpublishedBranches: jest.fn().mockResolvedValue(['cms/branch1', 'cms/branch2']),
      };

      await expect(forgejoImplementation.unpublishedEntries()).resolves.toEqual([
        'branch1',
        'branch2',
      ]);
    });

    it('should get unpublished entry', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = {
        generateContentKey: jest.fn().mockReturnValue('collection/slug'),
        retrieveUnpublishedEntryData: jest
          .fn()
          .mockResolvedValue({ slug: 'slug', status: 'draft' }),
      };

      await expect(
        forgejoImplementation.unpublishedEntry({ collection: 'collection', slug: 'slug' }),
      ).resolves.toEqual({
        slug: 'slug',
        status: 'draft',
      });
      expect(forgejoImplementation.api.retrieveUnpublishedEntryData).toHaveBeenCalledWith(
        'collection/slug',
      );
    });

    it('should get unpublished entry data file', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      forgejoImplementation.api = {
        generateContentKey: jest.fn().mockReturnValue('collection/slug'),
        readFile: jest.fn().mockResolvedValue('file-content'),
      };

      await expect(
        forgejoImplementation.unpublishedEntryDataFile(
          'collection',
          'slug',
          'path/to/file',
          'sha-123',
        ),
      ).resolves.toEqual('file-content');
    });

    it('should get unpublished entry media file', async () => {
      const forgejoImplementation = new ForgejoImplementation(config);
      const blob = new Blob(['content']);
      forgejoImplementation.api = {
        generateContentKey: jest.fn().mockReturnValue('collection/slug'),
        readFile: jest.fn().mockResolvedValue(blob),
      };

      const result = await forgejoImplementation.unpublishedEntryMediaFile(
        'collection',
        'slug',
        'path/to/image.png',
        'sha-456',
      );

      expect(result.name).toBe('image.png');
      expect(result.file).toEqual(expect.any(File));
    });
  });

  describe('open authoring', () => {
    describe('authenticateWithFork', () => {
      it('should use origin repo if user is maintainer', async () => {
        const forgejoImplementation = new ForgejoImplementation(
          {
            ...config,
            backend: { ...config.backend, open_authoring: true },
          },
          { useWorkflow: true },
        );

        forgejoImplementation.userIsOriginMaintainer = jest.fn().mockResolvedValue(true);
        forgejoImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'user' });
        forgejoImplementation.api = {
          forkExists: jest.fn(),
          mergeUpstream: jest.fn(),
          createFork: jest.fn(),
        };

        await forgejoImplementation.authenticateWithFork({
          userData: { token: 'token' },
          getPermissionToFork: jest.fn(),
        });

        expect(forgejoImplementation.repo).toBe('owner/repo');
        expect(forgejoImplementation.useOpenAuthoring).toBe(false);
      });

      it('should create fork if user is contributor', async () => {
        const mockForkExists = jest.fn().mockResolvedValue(false);
        const mockCreateFork = jest.fn().mockResolvedValue({ full_name: 'contributor/repo' });
        const mockMergeUpstream = jest.fn();

        const forgejoImplementation = new ForgejoImplementation(
          {
            ...config,
            backend: { ...config.backend, open_authoring: true },
          },
          {
            useWorkflow: true,
            API: {
              forkExists: mockForkExists,
              createFork: mockCreateFork,
              mergeUpstream: mockMergeUpstream,
            },
          },
        );

        forgejoImplementation.userIsOriginMaintainer = jest.fn().mockResolvedValue(false);
        forgejoImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'contributor' });
        forgejoImplementation.pollUntilForkExists = jest.fn().mockResolvedValue(undefined);

        await forgejoImplementation.authenticateWithFork({
          userData: { token: 'token' },
          getPermissionToFork: jest.fn().mockResolvedValue(),
        });

        expect(forgejoImplementation.repo).toBe('contributor/repo');
        expect(forgejoImplementation.useOpenAuthoring).toBe(true);
        expect(mockCreateFork).toHaveBeenCalled();
      });

      it('should sync existing fork if one exists', async () => {
        const mockForkExists = jest.fn().mockResolvedValue(true);
        const mockMergeUpstream = jest.fn().mockResolvedValue(undefined);
        const mockCreateFork = jest.fn();

        const forgejoImplementation = new ForgejoImplementation(
          {
            ...config,
            backend: { ...config.backend, open_authoring: true },
          },
          {
            useWorkflow: true,
            API: {
              forkExists: mockForkExists,
              mergeUpstream: mockMergeUpstream,
              createFork: mockCreateFork,
            },
          },
        );

        forgejoImplementation.userIsOriginMaintainer = jest.fn().mockResolvedValue(false);
        forgejoImplementation.currentUser = jest.fn().mockResolvedValue({ login: 'contributor' });

        await forgejoImplementation.authenticateWithFork({
          userData: { token: 'token' },
          getPermissionToFork: jest.fn(),
        });

        expect(forgejoImplementation.repo).toBe('contributor/repo');
        expect(forgejoImplementation.useOpenAuthoring).toBe(true);
        expect(mockMergeUpstream).toHaveBeenCalled();
        expect(mockCreateFork).not.toHaveBeenCalled();
      });
    });
  });
});
