import API from '../API';

const BITBUCKET = 'https://api.bitbucket.org/2.0';

global.fetch = jest.fn();

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  };
}

function fetchedURLs() {
  return global.fetch.mock.calls.map(([url]) => url);
}

describe('bitbucket API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // `resetAllMocks` also clears this, so set it again before every test
    global.fetch.mockRejectedValue(new Error('should not call fetch inside tests'));
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

  describe('requestAllValues', () => {
    test('should send later pages to the configured api root', async () => {
      const api = new API({ apiRoot: 'https://proxy.example.com/bitbucket/2.0' });
      global.fetch
        .mockResolvedValueOnce(
          jsonResponse({ values: [1], next: `${BITBUCKET}/repositories/owner/repo/items?page=2` }),
        )
        .mockResolvedValueOnce(jsonResponse({ values: [2] }));

      await expect(
        api.requestAllValues({ url: '/repositories/owner/repo/items' }),
      ).resolves.toEqual([1, 2]);

      expect(fetchedURLs()).toEqual([
        'https://proxy.example.com/bitbucket/2.0/repositories/owner/repo/items',
        'https://proxy.example.com/bitbucket/2.0/repositories/owner/repo/items?page=2',
      ]);
    });

    test('should stop when a next link repeats', async () => {
      const api = new API({});
      const next = `${BITBUCKET}/repositories/owner/repo/items?page=2`;
      global.fetch
        .mockResolvedValueOnce(jsonResponse({ values: [1], next }))
        .mockResolvedValueOnce(jsonResponse({ values: [2], next }));

      await expect(
        api.requestAllValues({ url: '/repositories/owner/repo/items' }),
      ).resolves.toEqual([1, 2]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('should get pull requests from every page', async () => {
    const api = new API({ repo: 'owner/repo', branch: 'main' });
    // Bitbucket writes the spaces in a `next` link's query as `+`
    const next =
      `${BITBUCKET}/repositories/owner/repo/pullrequests?pagelen=50` +
      '&q=state+%3D+%22OPEN%22+AND+source.branch.name+~+%22cms%2F%22&page=2';
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ values: [{ id: 1 }, { id: 2 }], next }))
      .mockResolvedValueOnce(jsonResponse({ values: [{ id: 3 }] }));
    api.getPullRequestLabel = jest.fn(id =>
      Promise.resolve(id === 2 ? 'other' : 'decap-cms/draft'),
    );

    await expect(api.getPullRequests()).resolves.toEqual([{ id: 1 }, { id: 3 }]);

    const urls = fetchedURLs();
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain(`${BITBUCKET}/repositories/owner/repo/pullrequests?pagelen=50&q=`);
    expect(urls[1]).toBe(
      `${BITBUCKET}/repositories/owner/repo/pullrequests?pagelen=50` +
        '&q=state%20%3D%20%22OPEN%22%20AND%20source.branch.name%20~%20%22cms%2F%22&page=2',
    );
    expect(api.getPullRequestLabel).toHaveBeenCalledTimes(3);
  });

  test('should list each pull request once, most recently updated first', async () => {
    const api = new API({ repo: 'owner/repo', branch: 'main' });
    const first = { id: 1, updated_on: '2026-01-01T00:00:00.000000+00:00' };
    const second = { id: 2, updated_on: '2026-03-01T00:00:00.000000+00:00' };
    const third = { id: 3, updated_on: '2026-02-01T00:00:00.000000+00:00' };
    global.fetch
      .mockResolvedValueOnce(
        jsonResponse({
          values: [first, second],
          next: `${BITBUCKET}/repositories/owner/repo/pullrequests?sort=id&page=2`,
        }),
      )
      // The second pull request moved onto this page while the pages loaded
      .mockResolvedValueOnce(jsonResponse({ values: [second, third] }));
    api.getPullRequestLabel = jest.fn(() => Promise.resolve('decap-cms/draft'));

    await expect(api.getPullRequests()).resolves.toEqual([second, third, first]);

    expect(new URL(fetchedURLs()[0]).searchParams.get('sort')).toBe('id');
    expect(api.getPullRequestLabel).toHaveBeenCalledTimes(3);
  });

  test('should request at most 10 pull request labels at a time', async () => {
    const api = new API({ repo: 'owner/repo', branch: 'main' });
    const pullRequests = Array.from({ length: 25 }, (_, index) => ({ id: index + 1 }));
    global.fetch.mockResolvedValueOnce(jsonResponse({ values: pullRequests }));
    let active = 0;
    let maxActive = 0;
    api.getPullRequestLabel = jest.fn(async id => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 0));
      active--;
      return id === 2 ? 'other' : 'decap-cms/draft';
    });

    const result = await api.getPullRequests();

    expect(result).toHaveLength(24);
    expect(result).not.toContainEqual({ id: 2 });
    expect(api.getPullRequestLabel).toHaveBeenCalledTimes(25);
    expect(maxActive).toBe(10);
  });

  test('should read the status label from the last page of comments', async () => {
    const api = new API({ repo: 'owner/repo' });
    global.fetch
      .mockResolvedValueOnce(
        jsonResponse({
          values: [{ content: { raw: 'decap-cms/draft' } }, { content: { raw: 'Looks good' } }],
          next: `${BITBUCKET}/repositories/owner/repo/pullrequests/1/comments?pagelen=100&page=2`,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ values: [{ content: { raw: 'decap-cms/pending_publish' } }] }),
      );

    await expect(api.getPullRequestLabel(1)).resolves.toBe('decap-cms/pending_publish');

    expect(fetchedURLs()).toEqual([
      `${BITBUCKET}/repositories/owner/repo/pullrequests/1/comments?pagelen=100`,
      `${BITBUCKET}/repositories/owner/repo/pullrequests/1/comments?pagelen=100&page=2`,
    ]);
  });

  test('should get pull request statuses from every page', async () => {
    const api = new API({ repo: 'owner/repo' });
    global.fetch
      .mockResolvedValueOnce(
        jsonResponse({
          values: [{ key: 'build' }],
          next: `${BITBUCKET}/repositories/owner/repo/pullrequests/1/statuses?pagelen=100&page=2`,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ values: [{ key: 'deploy' }] }));

    await expect(api.getPullRequestStatuses({ id: 1 })).resolves.toEqual([
      { key: 'build' },
      { key: 'deploy' },
    ]);
  });

  describe('listAllFiles', () => {
    test('should list the files from every page', async () => {
      const api = new API({ repo: 'owner/repo' });
      api.branchCommitSha = jest.fn(() => Promise.resolve('sha'));
      global.fetch
        .mockResolvedValueOnce(
          jsonResponse({
            values: [
              { type: 'commit_file', path: 'media/a.png', commit: { hash: 'sha' } },
              { type: 'commit_directory', path: 'media/sub' },
            ],
            next: `${BITBUCKET}/repositories/owner/repo/src/sha/media?max_depth=1&pagelen=100&page=abc`,
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            values: [{ type: 'commit_file', path: 'media/b.png', commit: { hash: 'sha' } }],
          }),
        );

      await expect(api.listAllFiles('media', 1, 'main')).resolves.toEqual([
        { id: 'sha/media/a.png', type: 'commit_file', path: 'media/a.png', name: 'a.png' },
        { id: 'sha/media/b.png', type: 'commit_file', path: 'media/b.png', name: 'b.png' },
      ]);

      expect(fetchedURLs()).toEqual([
        `${BITBUCKET}/repositories/owner/repo/src/sha/media?max_depth=1&pagelen=100`,
        `${BITBUCKET}/repositories/owner/repo/src/sha/media?max_depth=1&pagelen=100&page=abc`,
      ]);
    });

    test('should return no files for a missing folder', async () => {
      const api = new API({ repo: 'owner/repo' });
      api.branchCommitSha = jest.fn(() => Promise.resolve('sha'));
      global.fetch.mockResolvedValueOnce(
        jsonResponse({ type: 'error', error: { message: 'No such file or directory' } }, 404),
      );

      await expect(api.listAllFiles('media', 1, 'main')).resolves.toEqual([]);
    });
  });
});
