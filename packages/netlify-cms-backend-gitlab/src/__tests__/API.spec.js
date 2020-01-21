import API, { getMaxAccess } from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

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
      api.requestJSON.mockRejectedValue(new Error('Not Found'));

      await expect(api.hasWriteAccess()).resolves.toBe(false);
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
