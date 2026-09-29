import { APIError } from 'decap-cms-lib-util';

import API from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('GitLab API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('hasWriteAccess', () => {
    describe('with the editorial workflow', () => {
      test.each([30, 40, 50])('should return true on member access_level %i', async level => {
        const api = new API({ repo: 'repo', useWorkflow: true });

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockResolvedValueOnce([{ access_level: level }]);

        await expect(api.hasWriteAccess(1)).resolves.toBe(true);

        expect(api.requestJSON).toHaveBeenCalledTimes(2);
        expect(api.requestJSON).toHaveBeenNthCalledWith(1, '/projects/repo');
        expect(api.requestJSON).toHaveBeenNthCalledWith(2, {
          url: '/projects/repo/members/all',
          params: { 'user_ids[]': 1, state: 'active' },
        });
      });

      test.each([10, 20])('should return false on member access_level %i', async level => {
        const api = new API({ repo: 'repo', useWorkflow: true });

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockResolvedValueOnce([{ access_level: level }]);

        await expect(api.hasWriteAccess(1)).resolves.toBe(false);
      });

      test('should return false when the user is not an active member of the project', async () => {
        const api = new API({ repo: 'repo', useWorkflow: true });

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockResolvedValueOnce([]);

        await expect(api.hasWriteAccess(1)).resolves.toBe(false);

        expect(console.log).not.toHaveBeenCalled();
      });

      test('should return false on error getting the member', async () => {
        const api = new API({ repo: 'repo', useWorkflow: true });
        const error = new APIError('Internal Server Error', 500, 'GitLab');

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockRejectedValueOnce(error);

        await expect(api.hasWriteAccess(1)).resolves.toBe(false);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('Failed getting project member', error);
      });
    });

    describe('with the simple workflow', () => {
      test('should return true when the user can push to the branch', async () => {
        const api = new API({ repo: 'repo', branch: 'main' });

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockResolvedValueOnce({ name: 'main', can_push: true });

        await expect(api.hasWriteAccess(1)).resolves.toBe(true);

        expect(api.requestJSON).toHaveBeenCalledTimes(2);
        expect(api.requestJSON).toHaveBeenNthCalledWith(
          2,
          '/projects/repo/repository/branches/main',
        );
      });

      test('should return false when the user cannot push to the branch', async () => {
        const api = new API({ repo: 'repo', branch: 'main' });

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockResolvedValueOnce({ name: 'main', can_push: false });

        await expect(api.hasWriteAccess(1)).resolves.toBe(false);
      });

      test('should return false on error getting the branch', async () => {
        const api = new API({ repo: 'repo', branch: 'main' });
        const error = new APIError('Not Found', 404, 'GitLab');

        api.requestJSON = jest.fn();
        api.requestJSON.mockResolvedValueOnce({});
        api.requestJSON.mockRejectedValueOnce(error);

        await expect(api.hasWriteAccess(1)).resolves.toBe(false);

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('Failed getting default branch', error);
      });
    });

    test('should throw when the project is not found', async () => {
      const api = new API({ repo: 'repo', useWorkflow: true });
      const error = new APIError('Not Found', 404, 'GitLab');

      api.requestJSON = jest.fn().mockRejectedValueOnce(error);

      await expect(api.hasWriteAccess(1)).rejects.toBe(error);

      expect(api.requestJSON).toHaveBeenCalledTimes(1);
    });
  });

  describe('readFile', () => {
    test('does not request GitLab LFS content by default', async () => {
      const api = new API({ repo: 'foo/bar' });

      api.request = jest.fn().mockResolvedValue({});
      api.responseToText = jest.fn().mockReturnValue('file content');

      await expect(api.readFile('static/uploads/image.png', null)).resolves.toBe('file content');

      expect(api.request).toHaveBeenCalledWith({
        url: '/projects/foo%2Fbar/repository/files/static%2Fuploads%2Fimage.png/raw',
        params: { ref: 'master' },
        cache: 'no-store',
      });
    });

    test('requests GitLab LFS content when requested', async () => {
      const api = new API({ repo: 'foo/bar' });
      const blob = new Blob(['image content']);

      api.request = jest.fn().mockResolvedValue({});
      api.responseToBlob = jest.fn().mockReturnValue(blob);

      await expect(
        api.readFile('static/uploads/image.png', null, { parseText: false, lfs: true }),
      ).resolves.toBe(blob);

      expect(api.request).toHaveBeenCalledWith({
        url: '/projects/foo%2Fbar/repository/files/static%2Fuploads%2Fimage.png/raw',
        params: { ref: 'master', lfs: true },
        cache: 'no-store',
      });
    });
  });

  describe('getStatuses', () => {
    test('should get preview statuses', async () => {
      const api = new API({ repo: 'repo' });

      const mr = { sha: 'sha' };
      const statuses = [
        { name: 'deploy', status: 'success', target_url: 'deploy-url' },
        { name: 'build', status: 'pending' },
      ];

      api.getBranchMergeRequest = jest.fn(() => Promise.resolve(mr));
      api.getMergeRequestStatues = jest.fn(() => Promise.resolve(statuses));

      const collectionName = 'posts';
      const slug = 'title';
      await expect(api.getStatuses(collectionName, slug)).resolves.toEqual([
        { context: 'deploy', state: 'success', target_url: 'deploy-url' },
        { context: 'build', state: 'other' },
      ]);

      expect(api.getBranchMergeRequest).toHaveBeenCalledTimes(1);
      expect(api.getBranchMergeRequest).toHaveBeenCalledWith('cms/posts/title');

      expect(api.getMergeRequestStatues).toHaveBeenCalledTimes(1);
      expect(api.getMergeRequestStatues).toHaveBeenCalledWith(mr, 'cms/posts/title');
    });
  });
});
