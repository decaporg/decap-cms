import API from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('bitbucket API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should get preview statuses', async () => {
    const api = new API({});

    const pr = { id: 1 };
    const statuses = [
      { key: 'deploy', state: 'SUCCESSFUL', url: 'deploy-url' },
      { key: 'build', state: 'FAILED' },
    ];

    api.getBranchPullRequest = jest.fn(() => Promise.resolve(pr));
    api.getPullRequestStatuses = jest.fn(() => Promise.resolve(statuses));

    const collectionName = 'posts';
    const slug = 'title';
    await expect(api.getStatuses(collectionName, slug)).resolves.toEqual([
      { context: 'deploy', state: 'success', target_url: 'deploy-url' },
      { context: 'build', state: 'other' },
    ]);

    expect(api.getBranchPullRequest).toHaveBeenCalledTimes(1);
    expect(api.getBranchPullRequest).toHaveBeenCalledWith(`cms/posts/title`);

    expect(api.getPullRequestStatuses).toHaveBeenCalledTimes(1);
    expect(api.getPullRequestStatuses).toHaveBeenCalledWith(pr);
  });
});
