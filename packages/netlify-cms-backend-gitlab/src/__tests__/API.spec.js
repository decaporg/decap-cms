import API from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('GitLab API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

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
