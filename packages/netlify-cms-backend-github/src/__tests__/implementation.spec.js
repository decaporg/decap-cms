import GitHubImplementation from '../implementation';

describe('github backend implementation', () => {
  describe('persistMedia', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const persistFiles = jest.fn();
    const mockAPI = {
      persistFiles,
    };

    persistFiles.mockImplementation((_, files) => {
      files.forEach((file, index) => {
        file.sha = index;
      });
    });

    const createObjectURL = jest.fn();
    global.URL = {
      createObjectURL,
    };

    createObjectURL.mockReturnValue('displayURL');

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
      }),
    };

    beforeEach(() => {
      jest.clearAllMocks();
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
});
