import { Base64 } from 'js-base64';

import API from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('gitea API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockAPI(api, responses) {
    api.request = jest.fn().mockImplementation((path, options = {}) => {
      const normalizedPath = path.indexOf('?') !== -1 ? path.slice(0, path.indexOf('?')) : path;
      const response = responses[normalizedPath];
      return typeof response === 'function'
        ? Promise.resolve(response(options))
        : Promise.reject(new Error(`No response for path '${normalizedPath}'`));
    });
  }

  describe('request', () => {
    const fetch = jest.fn();
    beforeEach(() => {
      global.fetch = fetch;
    });

    afterEach(() => {
      jest.clearAllMocks();
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
      expect(fetch).toHaveBeenCalledWith('https://try.gitea.io/api/v1/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'token token',
          'Content-Type': 'application/json; charset=utf-8',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should throw error on not ok response', async () => {
      const api = new API({ branch: 'gt-pages', repo: 'my-repo', token: 'token' });

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
          api: 'Gitea',
        }),
      );
    });

    it('should allow overriding requestHeaders to return a promise ', async () => {
      const api = new API({ branch: 'gt-pages', repo: 'my-repo', token: 'token' });

      api.requestHeaders = jest.fn().mockResolvedValue({
        Authorization: 'promise-token',
        'Content-Type': 'application/json; charset=utf-8',
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://try.gitea.io/api/v1/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'promise-token',
          'Content-Type': 'application/json; charset=utf-8',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('persistFiles', () => {
    it('should create a new commit', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const responses = {
        '/repos/owner/repo/git/trees/master:content%2Fposts': () => {
          return { tree: [{ path: 'update-post.md', sha: 'old-sha' }] };
        },

        '/repos/owner/repo/contents': () => ({
          commit: { sha: 'new-sha' },
          files: [
            {
              path: 'content/posts/new-post.md',
            },
            {
              path: 'content/posts/update-post.md',
            },
          ],
        }),
      };
      mockAPI(api, responses);

      const entry = {
        dataFiles: [
          {
            slug: 'entry',
            path: 'content/posts/new-post.md',
            raw: 'content',
          },
          {
            slug: 'entry',
            sha: 'old-sha',
            path: 'content/posts/update-post.md',
            raw: 'content',
          },
        ],
        assets: [],
      };
      await expect(
        api.persistFiles(entry.dataFiles, entry.assets, {
          commitMessage: 'commitMessage',
          newEntry: true,
        }),
      ).resolves.toEqual({
        commit: { sha: 'new-sha' },
        files: [
          {
            path: 'content/posts/new-post.md',
          },
          {
            path: 'content/posts/update-post.md',
          },
        ],
      });

      expect(api.request).toHaveBeenCalledTimes(3);

      expect(api.request.mock.calls[0]).toEqual([
        '/repos/owner/repo/git/trees/master:content%2Fposts',
      ]);

      expect(api.request.mock.calls[1]).toEqual([
        '/repos/owner/repo/git/trees/master:content%2Fposts',
      ]);

      expect(api.request.mock.calls[2]).toEqual([
        '/repos/owner/repo/contents',
        {
          method: 'POST',
          body: JSON.stringify({
            branch: 'master',
            files: [
              {
                operation: 'create',
                content: Base64.encode(entry.dataFiles[0].raw),
                path: entry.dataFiles[0].path,
              },
              {
                operation: 'update',
                content: Base64.encode(entry.dataFiles[1].raw),
                path: entry.dataFiles[1].path,
                sha: entry.dataFiles[1].sha,
              },
            ],
            message: 'commitMessage',
          }),
        },
      ]);
    });
  });

  describe('deleteFiles', () => {
    it('should check if files exist and delete them', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const responses = {
        '/repos/owner/repo/git/trees/master:content%2Fposts': () => {
          return {
            tree: [
              { path: 'delete-post-1.md', sha: 'old-sha-1' },
              { path: 'delete-post-2.md', sha: 'old-sha-2' },
            ],
          };
        },

        '/repos/owner/repo/contents': () => ({
          commit: { sha: 'new-sha' },
          files: [
            {
              path: 'content/posts/delete-post-1.md',
            },
            {
              path: 'content/posts/delete-post-2.md',
            },
          ],
        }),
      };
      mockAPI(api, responses);

      const deleteFiles = ['content/posts/delete-post-1.md', 'content/posts/delete-post-2.md'];

      await api.deleteFiles(deleteFiles, 'commitMessage');

      expect(api.request).toHaveBeenCalledTimes(3);

      expect(api.request.mock.calls[0]).toEqual([
        '/repos/owner/repo/git/trees/master:content%2Fposts',
      ]);

      expect(api.request.mock.calls[1]).toEqual([
        '/repos/owner/repo/git/trees/master:content%2Fposts',
      ]);

      expect(api.request.mock.calls[2]).toEqual([
        '/repos/owner/repo/contents',
        {
          method: 'POST',
          body: JSON.stringify({
            branch: 'master',
            files: [
              {
                operation: 'delete',
                path: deleteFiles[0],
                sha: 'old-sha-1',
              },
              {
                operation: 'delete',
                path: deleteFiles[1],
                sha: 'old-sha-2',
              },
            ],
            message: 'commitMessage',
          }),
        },
      ]);
    });
  });

  describe('listFiles', () => {
    it('should get files by depth', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const tree = [
        {
          path: 'post.md',
          type: 'blob',
        },
        {
          path: 'dir1',
          type: 'tree',
        },
        {
          path: 'dir1/nested-post.md',
          type: 'blob',
        },
        {
          path: 'dir1/dir2',
          type: 'tree',
        },
        {
          path: 'dir1/dir2/nested-post.md',
          type: 'blob',
        },
      ];
      api.request = jest.fn().mockResolvedValue({ tree });

      await expect(api.listFiles('posts', { depth: 1 })).resolves.toEqual([
        {
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:posts', {
        params: {},
      });

      jest.clearAllMocks();
      await expect(api.listFiles('posts', { depth: 2 })).resolves.toEqual([
        {
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
        {
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:posts', {
        params: { recursive: 1 },
      });

      jest.clearAllMocks();
      await expect(api.listFiles('posts', { depth: 3 })).resolves.toEqual([
        {
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
        {
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
        {
          path: 'posts/dir1/dir2/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:posts', {
        params: { recursive: 1 },
      });
    });
    it('should get files and folders', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const tree = [
        {
          path: 'image.png',
          type: 'blob',
        },
        {
          path: 'dir1',
          type: 'tree',
        },
        {
          path: 'dir1/nested-image.png',
          type: 'blob',
        },
        {
          path: 'dir1/dir2',
          type: 'tree',
        },
        {
          path: 'dir1/dir2/nested-image.png',
          type: 'blob',
        },
      ];
      api.request = jest.fn().mockResolvedValue({ tree });

      await expect(api.listFiles('media', {}, true)).resolves.toEqual([
        {
          path: 'media/image.png',
          type: 'blob',
          name: 'image.png',
        },
        {
          path: 'media/dir1',
          type: 'tree',
          name: 'dir1',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:media', {
        params: {},
      });
    });
  });
});
