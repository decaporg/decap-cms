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

  test('should get pull requests from every page', async () => {
    const api = new API({ repo: 'owner/repo', branch: 'main' });

    const nextUrl = 'https://api.bitbucket.org/2.0/repositories/owner/repo/pullrequests?page=2';
    api.requestJSON = jest
      .fn()
      .mockResolvedValueOnce({ values: [{ id: 1 }, { id: 2 }], next: nextUrl })
      .mockResolvedValueOnce({ values: [{ id: 3 }] });
    api.getPullRequestLabel = jest.fn(id =>
      Promise.resolve(id === 2 ? 'other' : 'decap-cms/draft'),
    );

    await expect(api.getPullRequests()).resolves.toEqual([{ id: 1 }, { id: 3 }]);

    expect(api.requestJSON).toHaveBeenCalledTimes(2);
    expect(api.requestJSON).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: '/repositories/owner/repo/pullrequests',
      }),
    );
    expect(api.requestJSON).toHaveBeenNthCalledWith(2, nextUrl);
    expect(api.getPullRequestLabel).toHaveBeenCalledTimes(3);
  });
});
