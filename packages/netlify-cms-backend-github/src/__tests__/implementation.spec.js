import GitHubImplementation from '../implementation';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('github backend implementation', () => {
  const config = {
    getIn: jest.fn().mockImplementation(array => {
      if (array[0] === 'backend' && array[1] === 'repo') {
        return 'owner/repo';
      }
      if (array[0] === 'backend' && array[1] === 'open_authoring') {
        return false;
      }
      if (array[0] === 'backend' && array[1] === 'branch') {
        return 'master';
      }
      if (array[0] === 'backend' && array[1] === 'api_root') {
        return 'https://api.github.com';
      }
    }),
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

    it('should persist media file when not draft', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const mediaFile = {
        value: 'image.png',
        fileObj: { size: 100 },
        path: '/media/image.png',
      };

      expect.assertions(5);
      await expect(gitHubImplementation.persistMedia(mediaFile)).resolves.toEqual({
        id: 0,
        name: 'image.png',
        size: 100,
        displayURL: 'displayURL',
        path: 'media/image.png',
        draft: undefined,
      });

      expect(persistFiles).toHaveBeenCalledTimes(1);
      expect(persistFiles).toHaveBeenCalledWith(null, [mediaFile], {});
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledWith(mediaFile.fileObj);
    });

    it('should not persist media file when draft', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      createObjectURL.mockReturnValue('displayURL');

      const mediaFile = {
        value: 'image.png',
        fileObj: { size: 100 },
        path: '/media/image.png',
      };

      expect.assertions(4);
      await expect(gitHubImplementation.persistMedia(mediaFile, { draft: true })).resolves.toEqual({
        id: undefined,
        name: 'image.png',
        size: 100,
        displayURL: 'displayURL',
        path: 'media/image.png',
        draft: true,
      });

      expect(persistFiles).toHaveBeenCalledTimes(0);
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

  describe('getMediaFiles', () => {
    const getMediaAsBlob = jest.fn();
    const mockAPI = {
      getMediaAsBlob,
    };

    it('should return media files from meta data', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;

      const blob = new Blob(['']);
      getMediaAsBlob.mockResolvedValue(blob);

      const file = new File([blob], name);

      const data = {
        metaData: {
          objects: {
            files: [{ path: 'static/media/image.png', sha: 'image.png' }],
          },
        },
      };

      await expect(gitHubImplementation.getMediaFiles(data)).resolves.toEqual([
        {
          id: 'image.png',
          sha: 'image.png',
          displayURL: 'displayURL',
          path: 'static/media/image.png',
          name: 'image.png',
          size: file.size,
          file,
        },
      ]);
    });
  });

  describe('unpublishedEntry', () => {
    const generateContentKey = jest.fn();
    const readUnpublishedBranchFile = jest.fn();

    const mockAPI = {
      generateContentKey,
      readUnpublishedBranchFile,
    };

    it('should return unpublished entry', async () => {
      const gitHubImplementation = new GitHubImplementation(config);
      gitHubImplementation.api = mockAPI;
      gitHubImplementation.getMediaFiles = jest.fn().mockResolvedValue([{ path: 'image.png' }]);

      generateContentKey.mockReturnValue('contentKey');

      const data = {
        fileData: 'fileData',
        isModification: true,
        metaData: { objects: { entry: { path: 'entry-path' } } },
      };
      readUnpublishedBranchFile.mockResolvedValue(data);

      const collection = { get: jest.fn().mockReturnValue('posts') };
      await expect(gitHubImplementation.unpublishedEntry(collection, 'slug')).resolves.toEqual({
        slug: 'slug',
        file: { path: 'entry-path' },
        data: 'fileData',
        metaData: { objects: { entry: { path: 'entry-path' } } },
        mediaFiles: [{ path: 'image.png' }],
        isModification: true,
      });

      expect(generateContentKey).toHaveBeenCalledTimes(1);
      expect(generateContentKey).toHaveBeenCalledWith('posts', 'slug');

      expect(readUnpublishedBranchFile).toHaveBeenCalledTimes(1);
      expect(readUnpublishedBranchFile).toHaveBeenCalledWith('contentKey');

      expect(gitHubImplementation.getMediaFiles).toHaveBeenCalledTimes(1);
      expect(gitHubImplementation.getMediaFiles).toHaveBeenCalledWith(data);
    });
  });
});
