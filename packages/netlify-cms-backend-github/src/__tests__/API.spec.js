import { Base64 } from 'js-base64';
import API from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('github API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const mockAPI = (api, responses) => {
    api.request = jest.fn().mockImplementation((path, options = {}) => {
      const normalizedPath = path.indexOf('?') !== -1 ? path.substr(0, path.indexOf('?')) : path;
      const response = responses[normalizedPath];
      return typeof response === 'function'
        ? Promise.resolve(response(options))
        : Promise.reject(new Error(`No response for path '${normalizedPath}'`));
    });
  };

  describe('editorialWorkflowGit', () => {
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
          .editorialWorkflowGit([], { slug: 'entry', sha: 'abc' }, null, {})
          .then(() => prBaseBranch),
      ).resolves.toEqual('gh-pages');
    });
  });

  describe('updateTree', () => {
    it('should create tree with nested paths', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      api.createTree = jest.fn().mockImplementation(() => Promise.resolve({ sha: 'newTreeSha' }));

      const files = [
        { path: '/static/media/new-image.jpeg', sha: 'new-image.jpeg', remove: true },
        { path: 'content/posts/new-post.md', sha: 'new-post.md' },
      ];

      const baseTreeSha = 'baseTreeSha';

      await expect(api.updateTree(baseTreeSha, files)).resolves.toEqual({
        sha: 'newTreeSha',
        parentSha: baseTreeSha,
      });

      expect(api.createTree).toHaveBeenCalledTimes(1);
      expect(api.createTree).toHaveBeenCalledWith(baseTreeSha, [
        {
          path: 'static/media/new-image.jpeg',
          mode: '100644',
          type: 'blob',
          sha: null,
        },
        {
          path: 'content/posts/new-post.md',
          mode: '100644',
          type: 'blob',
          sha: 'new-post.md',
        },
      ]);
    });
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

  describe('getMediaAsBlob', () => {
    it('should return response blob on non svg file', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const blob = {};
      const response = { blob: jest.fn().mockResolvedValue(blob) };
      api.fetchBlob = jest.fn().mockResolvedValue(response);

      await expect(api.getMediaAsBlob('sha', 'static/media/image.png')).resolves.toBe(blob);

      expect(api.fetchBlob).toHaveBeenCalledTimes(1);
      expect(api.fetchBlob).toHaveBeenCalledWith('sha', '/repos/owner/repo');

      expect(response.blob).toHaveBeenCalledTimes(1);
    });

    it('should return test blob on non file', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const response = { text: jest.fn().mockResolvedValue('svg') };
      api.fetchBlob = jest.fn().mockResolvedValue(response);

      await expect(api.getMediaAsBlob('sha', 'static/media/logo.svg')).resolves.toEqual(
        new Blob(['svg'], { type: 'image/svg+xml' }),
      );

      expect(api.fetchBlob).toHaveBeenCalledTimes(1);
      expect(api.fetchBlob).toHaveBeenCalledWith('sha', '/repos/owner/repo');

      expect(response.text).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMediaDisplayURL', () => {
    it('should return createObjectURL result', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const blob = {};
      api.getMediaAsBlob = jest.fn().mockResolvedValue(blob);
      global.URL.createObjectURL = jest
        .fn()
        .mockResolvedValue('blob:http://localhost:8080/blob-id');

      await expect(api.getMediaDisplayURL('sha', 'static/media/image.png')).resolves.toBe(
        'blob:http://localhost:8080/blob-id',
      );

      expect(api.getMediaAsBlob).toHaveBeenCalledTimes(1);
      expect(api.getMediaAsBlob).toHaveBeenCalledWith('sha', 'static/media/image.png');

      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });
  });

  describe('persistFiles', () => {
    it('should update tree, commit and patch branch when useWorkflow is false', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const responses = {
        // upload the file
        '/repos/owner/repo/git/blobs': () => ({ sha: 'new-file-sha' }),

        // get the branch
        '/repos/owner/repo/branches/master': () => ({ commit: { sha: 'root' } }),

        // create new tree
        '/repos/owner/repo/git/trees': options => {
          const data = JSON.parse(options.body);
          return { sha: data.base_tree };
        },

        // update the commit with the tree
        '/repos/owner/repo/git/commits': () => ({ sha: 'commit-sha' }),

        // patch the branch
        '/repos/owner/repo/git/refs/heads/master': () => ({}),
      };
      mockAPI(api, responses);

      const entry = {
        slug: 'entry',
        sha: 'abc',
        path: 'content/posts/new-post.md',
        raw: 'content',
      };
      await api.persistFiles(entry, [], { commitMessage: 'commitMessage' });

      expect(api.request).toHaveBeenCalledTimes(5);

      expect(api.request.mock.calls[0]).toEqual([
        '/repos/owner/repo/git/blobs',
        {
          method: 'POST',
          body: JSON.stringify({ content: Base64.encode(entry.raw), encoding: 'base64' }),
        },
      ]);

      expect(api.request.mock.calls[1]).toEqual(['/repos/owner/repo/branches/master']);

      expect(api.request.mock.calls[2]).toEqual([
        '/repos/owner/repo/git/trees',
        {
          body: JSON.stringify({
            base_tree: 'root',
            tree: [
              {
                path: 'content/posts/new-post.md',
                mode: '100644',
                type: 'blob',
                sha: 'new-file-sha',
              },
            ],
          }),
          method: 'POST',
        },
      ]);

      expect(api.request.mock.calls[3]).toEqual([
        '/repos/owner/repo/git/commits',
        {
          body: JSON.stringify({
            message: 'commitMessage',
            tree: 'root',
            parents: ['root'],
          }),
          method: 'POST',
        },
      ]);

      expect(api.request.mock.calls[4]).toEqual([
        '/repos/owner/repo/git/refs/heads/master',
        {
          body: JSON.stringify({
            sha: 'commit-sha',
            force: false,
          }),
          method: 'PATCH',
        },
      ]);
    });

    it('should call editorialWorkflowGit when useWorkflow is true', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      api.uploadBlob = jest.fn();
      api.editorialWorkflowGit = jest.fn();

      const entry = {
        slug: 'entry',
        sha: 'abc',
        path: 'content/posts/new-post.md',
        raw: 'content',
      };

      const mediaFiles = [
        {
          path: '/static/media/image-1.png',
          uploaded: true,
          sha: 'image-1.png',
        },
        {
          path: '/static/media/image-2.png',
          sha: 'image-2.png',
        },
      ];

      await api.persistFiles(entry, mediaFiles, { useWorkflow: true });

      expect(api.uploadBlob).toHaveBeenCalledTimes(2);
      expect(api.uploadBlob).toHaveBeenCalledWith(entry);
      expect(api.uploadBlob).toHaveBeenCalledWith(mediaFiles[1]);

      expect(api.editorialWorkflowGit).toHaveBeenCalledTimes(1);

      expect(api.editorialWorkflowGit).toHaveBeenCalledWith(
        mediaFiles.concat(entry),
        entry,
        [
          { path: 'static/media/image-1.png', sha: 'image-1.png' },
          { path: 'static/media/image-2.png', sha: 'image-2.png' },
        ],
        { useWorkflow: true },
      );
    });
  });

  describe('migrateBranch', () => {
    it('should migrate to version 1 when no version', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const newBranch = { ref: 'refs/heads/cms/posts/2019-11-11-post-title' };
      api.migrateToVersion1 = jest.fn().mockResolvedValue(newBranch);
      const metadata = { type: 'PR' };
      api.retrieveMetadata = jest.fn().mockResolvedValue(metadata);

      const branch = { ref: 'refs/heads/cms/2019-11-11-post-title' };
      await expect(api.migrateBranch(branch)).resolves.toBe(newBranch);

      expect(api.migrateToVersion1).toHaveBeenCalledTimes(1);
      expect(api.migrateToVersion1).toHaveBeenCalledWith(branch, metadata);

      expect(api.retrieveMetadata).toHaveBeenCalledTimes(1);
      expect(api.retrieveMetadata).toHaveBeenCalledWith('2019-11-11-post-title');
    });

    it('should not migrate to version 1 when version is 1', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      api.migrateToVersion1 = jest.fn();
      const metadata = { type: 'PR', version: '1' };
      api.retrieveMetadata = jest.fn().mockResolvedValue(metadata);

      const branch = { ref: 'refs/heads/cms/posts/2019-11-11-post-title' };
      await expect(api.migrateBranch(branch)).resolves.toBe(branch);

      expect(api.migrateToVersion1).toHaveBeenCalledTimes(0);

      expect(api.retrieveMetadata).toHaveBeenCalledTimes(1);
      expect(api.retrieveMetadata).toHaveBeenCalledWith('posts/2019-11-11-post-title');
    });
  });

  describe('migrateToVersion1', () => {
    it('should migrate to version 1', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const newBranch = { ref: 'refs/heads/cms/posts/2019-11-11-post-title' };
      api.createBranch = jest.fn().mockResolvedValue(newBranch);

      const newPr = { number: 2, head: { sha: 'new_head' } };
      api.createPR = jest.fn().mockResolvedValue(newPr);

      api.storeMetadata = jest.fn();
      api.closePR = jest.fn();
      api.deleteBranch = jest.fn();
      api.deleteMetadata = jest.fn();

      const branch = { ref: 'refs/heads/cms/2019-11-11-post-title' };
      const metadata = {
        branch: 'cms/2019-11-11-post-title',
        type: 'PR',
        pr: { head: 'old_head' },
        commitMessage: 'commitMessage',
        collection: 'posts',
      };

      await expect(api.migrateToVersion1(branch, metadata)).resolves.toBe(newBranch);

      expect(api.createBranch).toHaveBeenCalledTimes(1);
      expect(api.createBranch).toHaveBeenCalledWith('cms/posts/2019-11-11-post-title', 'old_head');

      expect(api.createPR).toHaveBeenCalledTimes(1);
      expect(api.createPR).toHaveBeenCalledWith('commitMessage', 'cms/posts/2019-11-11-post-title');

      expect(api.storeMetadata).toHaveBeenCalledTimes(1);
      expect(api.storeMetadata).toHaveBeenCalledWith('posts/2019-11-11-post-title', {
        type: 'PR',
        pr: { head: 'new_head', number: 2 },
        commitMessage: 'commitMessage',
        collection: 'posts',
        branch: 'cms/posts/2019-11-11-post-title',
        version: '1',
      });

      expect(api.closePR).toHaveBeenCalledTimes(1);
      expect(api.closePR).toHaveBeenCalledWith(metadata.pr);

      expect(api.deleteBranch).toHaveBeenCalledTimes(1);
      expect(api.deleteBranch).toHaveBeenCalledWith('cms/2019-11-11-post-title');

      expect(api.deleteMetadata).toHaveBeenCalledTimes(1);
      expect(api.deleteMetadata).toHaveBeenCalledWith('2019-11-11-post-title');
    });
  });
});
