import API from '../API';

describe('github API', () => {
  const mockAPI = (api, responses) => {
    api.request = (path, options = {}) => {
      const normalizedPath = path.indexOf('?') !== -1 ? path.substr(0, path.indexOf('?')) : path;
      const response = responses[normalizedPath];
      return typeof response === 'function'
        ? Promise.resolve(response(options))
        : Promise.reject(new Error(`No response for path '${normalizedPath}'`));
    };
  };

  it('should create PR with correct base branch name when publishing with editorial workflow', () => {
    let prBaseBranch = null;
    const api = new API({ branch: 'gh-pages', repo: 'my-repo' });
    const responses = {
      '/repos/my-repo/branches/gh-pages': () => ({ commit: { sha: 'def' } }),
      '/repos/my-repo/git/trees/def': () => ({ tree: [] }),
      '/repos/my-repo/git/trees': () => ({}),
      '/repos/my-repo/git/commits': () => ({}),
      '/repos/my-repo/git/refs': () => ({}),
      '/repos/my-repo/pulls': pullRequest => {
        prBaseBranch = JSON.parse(pullRequest.body).base;
        return { head: { sha: 'cbd' } };
      },
      '/user': () => ({}),
      '/repos/my-repo/git/blobs': () => ({}),
      '/repos/my-repo/git/refs/meta/_netlify_cms': () => ({ object: {} }),
    };
    mockAPI(api, responses);

    return expect(
      api
        .editorialWorkflowGit(null, { slug: 'entry', sha: 'abc' }, null, {})
        .then(() => prBaseBranch),
    ).resolves.toEqual('gh-pages');
  });

  describe('request', () => {
    beforeEach(() => {
      const fetch = jest.fn();
      global.fetch = fetch;
      global.Date = jest.fn(() => ({ getTime: () => 1000 }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should fetch url with authorization header', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/some-path?ts=1000', {
        headers: { Authorization: 'token token', 'Content-Type': 'application/json' },
      });
    });

    it('should throw error on not ok response', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue({ message: 'some error' }),
        ok: false,
        status: 404,
        headers: { get: () => '' },
      });

      await expect(api.request('some-path')).rejects.toThrow(
        expect.objectContaining({
          message: 'some error',
          name: 'API_ERROR',
          status: 404,
          api: 'GitHub',
        }),
      );
    });

    it('should allow overriding requestHeaders to return a promise ', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });

      api.requestHeaders = jest
        .fn()
        .mockResolvedValue({ Authorization: 'promise-token', 'Content-Type': 'application/json' });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/some-path?ts=1000', {
        headers: { Authorization: 'promise-token', 'Content-Type': 'application/json' },
      });
    });
  });
});
