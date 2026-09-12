import API, { getMaxAccess } from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('GitLab API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('hasWriteAccess', () => {
    test('should return true on project access_level >= 30', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest
        .fn()
        .mockResolvedValueOnce({ permissions: { project_access: { access_level: 30 } } });

      await expect(api.hasWriteAccess()).resolves.toBe(true);
    });

    test('should return false on project access_level < 30', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest
        .fn()
        .mockResolvedValueOnce({ permissions: { project_access: { access_level: 10 } } });

      await expect(api.hasWriteAccess()).resolves.toBe(false);
    });

    test('should return true on group access_level >= 30', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest
        .fn()
        .mockResolvedValueOnce({ permissions: { group_access: { access_level: 30 } } });

      await expect(api.hasWriteAccess()).resolves.toBe(true);
    });

    test('should return false on group access_level < 30', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest
        .fn()
        .mockResolvedValueOnce({ permissions: { group_access: { access_level: 10 } } });

      await expect(api.hasWriteAccess()).resolves.toBe(false);
    });

    test('should return true on shared group access_level >= 40', async () => {
      const api = new API({ repo: 'repo' });
      api.requestJSON = jest.fn().mockResolvedValueOnce({
        permissions: { project_access: null, group_access: null },
        shared_with_groups: [{ group_access_level: 10 }, { group_access_level: 40 }],
      });

      await expect(api.hasWriteAccess()).resolves.toBe(true);

      expect(api.requestJSON).toHaveBeenCalledTimes(1);
    });

    test('should return true on shared group access_level >= 30, developers can merge and push', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest.fn();
      api.requestJSON.mockResolvedValueOnce({
        permissions: { project_access: null, group_access: null },
        shared_with_groups: [{ group_access_level: 10 }, { group_access_level: 30 }],
      });
      api.requestJSON.mockResolvedValueOnce({
        developers_can_merge: true,
        developers_can_push: true,
      });

      await expect(api.hasWriteAccess()).resolves.toBe(true);
    });

    test('should return false on shared group access_level < 30,', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest.fn();
      api.requestJSON.mockResolvedValueOnce({
        permissions: { project_access: null, group_access: null },
        shared_with_groups: [{ group_access_level: 10 }, { group_access_level: 20 }],
      });
      api.requestJSON.mockResolvedValueOnce({
        developers_can_merge: true,
        developers_can_push: true,
      });

      await expect(api.hasWriteAccess()).resolves.toBe(false);
    });

    test("should return false on shared group access_level >= 30, developers can't merge", async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest.fn();
      api.requestJSON.mockResolvedValueOnce({
        permissions: { project_access: null, group_access: null },
        shared_with_groups: [{ group_access_level: 10 }, { group_access_level: 30 }],
      });
      api.requestJSON.mockResolvedValueOnce({
        developers_can_merge: false,
        developers_can_push: true,
      });

      await expect(api.hasWriteAccess()).resolves.toBe(false);
    });

    test("should return false on shared group access_level >= 30, developers can't push", async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest.fn();
      api.requestJSON.mockResolvedValueOnce({
        permissions: { project_access: null, group_access: null },
        shared_with_groups: [{ group_access_level: 10 }, { group_access_level: 30 }],
      });
      api.requestJSON.mockResolvedValueOnce({
        developers_can_merge: true,
        developers_can_push: false,
      });

      await expect(api.hasWriteAccess()).resolves.toBe(false);
    });

    test('should return false on shared group access_level >= 30, error getting branch', async () => {
      const api = new API({ repo: 'repo' });

      api.requestJSON = jest.fn();
      api.requestJSON.mockResolvedValueOnce({
        permissions: { project_access: null, group_access: null },
        shared_with_groups: [{ group_access_level: 10 }, { group_access_level: 30 }],
      });

      const error = new Error('Not Found');
      api.requestJSON.mockRejectedValue(error);

      await expect(api.hasWriteAccess()).resolves.toBe(false);

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Failed getting default branch', error);
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

  describe('publishUnpublishedEntry', () => {
    test.each([false, true])(
      'merges the fetched head SHA with squashMerges=%s',
      async squashMerges => {
        const api = new API({ repo: 'foo/bar', squashMerges });
        const mergeRequest = { iid: 42, sha: 'reviewed-head-sha' };
        api.getBranchMergeRequest = jest.fn().mockResolvedValue(mergeRequest);
        api.requestJSON = jest.fn().mockResolvedValue({ state: 'merged' });

        await api.publishUnpublishedEntry('posts', 'title');

        expect(api.getBranchMergeRequest).toHaveBeenCalledWith('cms/posts/title');
        expect(api.requestJSON).toHaveBeenCalledTimes(1);
        expect(api.requestJSON).toHaveBeenCalledWith({
          method: 'PUT',
          url: '/projects/foo%2Fbar/merge_requests/42/merge',
          params: expect.objectContaining({
            sha: 'reviewed-head-sha',
            squash: squashMerges,
            should_remove_source_branch: true,
          }),
        });
      },
    );

    test('propagates a changed-head rejection without retrying the merge', async () => {
      const api = new API({ repo: 'foo/bar' });
      const error = new Error('SHA does not match HEAD of source branch');
      api.getBranchMergeRequest = jest.fn().mockResolvedValue({ iid: 42, sha: 'old-head-sha' });
      api.requestJSON = jest.fn().mockRejectedValue(error);

      await expect(api.publishUnpublishedEntry('posts', 'title')).rejects.toBe(error);

      expect(api.getBranchMergeRequest).toHaveBeenCalledTimes(1);
      expect(api.requestJSON).toHaveBeenCalledTimes(1);
      expect(api.requestJSON.mock.calls[0][0].params.sha).toBe('old-head-sha');
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

  describe('getMaxAccess', () => {
    it('should return group with max access level', () => {
      const groups = [
        { group_access_level: 10 },
        { group_access_level: 5 },
        { group_access_level: 100 },
        { group_access_level: 1 },
      ];
      expect(getMaxAccess(groups)).toBe(groups[2]);
    });
  });
});
