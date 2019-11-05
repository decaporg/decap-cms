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

  describe('composeFileTree', () => {
    it('should return file tree', () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      const files = [{ path: 'static/media/image.jpeg' }, { path: 'content/posts/post.md' }];

      expect(api.composeFileTree(files)).toEqual({
        content: {
          posts: {
            'post.md': {
              file: true,
              path: 'content/posts/post.md',
            },
          },
        },
        static: {
          media: {
            'image.jpeg': {
              file: true,
              path: 'static/media/image.jpeg',
            },
          },
        },
      });
    });

    it('should filter skipped files', () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      const files = [
        { path: 'static/media/image.jpeg', skip: true },
        { path: 'content/posts/post.md' },
      ];

      expect(api.composeFileTree(files)).toEqual({
        content: {
          posts: {
            'post.md': {
              file: true,
              path: 'content/posts/post.md',
            },
          },
        },
      });
    });
  });

  const mockedTrees = {
    root: {
      sha: 'root',
      tree: [
        {
          path: 'content',
          mode: '040000',
          type: 'tree',
          sha: 'content',
        },
        {
          path: 'static',
          mode: '040000',
          type: 'tree',
          sha: 'static',
        },
      ],
    },
    content: {
      sha: 'content',
      tree: [
        {
          path: 'pages',
          mode: '040000',
          type: 'tree',
          sha: 'pages',
        },
        {
          path: 'posts',
          mode: '040000',
          type: 'tree',
          sha: 'posts',
        },
      ],
    },
    static: {
      sha: 'static',
      tree: [
        {
          path: 'admin',
          mode: '040000',
          type: 'tree',
          sha: 'admin',
        },
        {
          path: 'images',
          mode: '040000',
          type: 'tree',
          sha: 'images',
        },
        {
          path: 'media',
          mode: '040000',
          type: 'tree',
          sha: 'media',
        },
      ],
    },
    media: {
      sha: 'media',
      tree: [
        {
          path: 'image-1.png',
          mode: '100644',
          type: 'blob',
          sha: 'image-1.png',
          size: 1000,
        },
        {
          path: 'image-2.png',
          mode: '100644',
          type: 'blob',
          sha: 'image-2.png',
          size: 2000,
        },
        {
          path: 'image-3.png',
          mode: '100644',
          type: 'blob',
          sha: 'image-3.png',
          size: 3000,
        },
      ],
    },
    posts: {
      sha: 'posts',
      tree: [
        {
          path: 'post-1.md',
          mode: '100644',
          type: 'blob',
          sha: 'post-1.md',
          size: 100,
        },
        {
          path: 'post-2.md',
          mode: '100644',
          type: 'blob',
          sha: 'post-2.md',
          size: 200,
        },
      ],
    },
  };

  describe('updateTree', () => {
    it('should create diff trees when updating existing files', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      api.createTree = jest.fn().mockImplementation(sha => Promise.resolve({ sha }));

      api.getTree = jest.fn().mockImplementation(sha => Promise.resolve(mockedTrees[sha]));

      const files = [{ path: 'content/posts/post-2.md', sha: 'post-2-new-sha.md' }];
      const fileTree = api.composeFileTree(files);

      await expect(api.updateTree('root', '/', fileTree)).resolves.toEqual({
        mode: '040000',
        parentSha: 'root',
        path: '/',
        sha: 'root',
        type: 'tree',
      });
      expect(api.getTree).toHaveBeenCalledTimes(3);
      expect(api.getTree).toHaveBeenCalledWith('root');
      expect(api.getTree).toHaveBeenCalledWith('content');
      expect(api.getTree).toHaveBeenCalledWith('posts');

      expect(api.createTree).toHaveBeenCalledTimes(3);
      // post-2 is a child of posts, and a tree should be created with the new sha
      expect(api.createTree).toHaveBeenCalledWith('posts', [
        {
          path: 'post-2.md',
          mode: '100644',
          type: 'blob',
          sha: 'post-2-new-sha.md',
        },
      ]);

      // posts should be a child of content
      expect(api.createTree).toHaveBeenCalledWith('content', [
        {
          path: 'posts',
          mode: '040000',
          type: 'tree',
          sha: 'posts',
          parentSha: 'posts',
        },
      ]);

      // content and media should be children of root
      expect(api.createTree).toHaveBeenCalledWith('root', [
        {
          path: 'content',
          mode: '040000',
          type: 'tree',
          sha: 'content',
          parentSha: 'content',
        },
      ]);
    });

    it('should create diff trees when adding new files', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      api.createTree = jest.fn().mockImplementation(sha => Promise.resolve({ sha }));

      api.getTree = jest.fn().mockImplementation(sha => Promise.resolve(mockedTrees[sha]));

      const files = [
        { path: 'static/media/new-image.jpeg', sha: 'new-image.jpeg' },
        { path: 'content/posts/new-post.md', sha: 'new-post.md' },
      ];
      const fileTree = api.composeFileTree(files);

      await expect(api.updateTree('root', '/', fileTree)).resolves.toEqual({
        mode: '040000',
        parentSha: 'root',
        path: '/',
        sha: 'root',
        type: 'tree',
      });
      expect(api.getTree).toHaveBeenCalledTimes(5);
      expect(api.getTree).toHaveBeenCalledWith('root');
      expect(api.getTree).toHaveBeenCalledWith('content');
      expect(api.getTree).toHaveBeenCalledWith('posts');
      expect(api.getTree).toHaveBeenCalledWith('static');
      expect(api.getTree).toHaveBeenCalledWith('media');

      expect(api.createTree).toHaveBeenCalledTimes(5);
      // new post should be a child of posts
      expect(api.createTree).toHaveBeenCalledWith('posts', [
        {
          path: 'new-post.md',
          mode: '100644',
          type: 'blob',
          sha: 'new-post.md',
        },
      ]);

      // new image should be a child of media
      expect(api.createTree).toHaveBeenCalledWith('media', [
        {
          path: 'new-image.jpeg',
          mode: '100644',
          type: 'blob',
          sha: 'new-image.jpeg',
        },
      ]);

      // posts should be a child of content
      expect(api.createTree).toHaveBeenCalledWith('content', [
        {
          path: 'posts',
          mode: '040000',
          type: 'tree',
          sha: 'posts',
          parentSha: 'posts',
        },
      ]);

      // media should be a childe of static
      expect(api.createTree).toHaveBeenCalledWith('static', [
        {
          path: 'media',
          mode: '040000',
          type: 'tree',
          sha: 'media',
          parentSha: 'media',
        },
      ]);

      // content and media should be children of root
      expect(api.createTree).toHaveBeenCalledWith('root', [
        {
          path: 'content',
          mode: '040000',
          type: 'tree',
          sha: 'content',
          parentSha: 'content',
        },
        {
          path: 'static',
          mode: '040000',
          type: 'tree',
          sha: 'static',
          parentSha: 'static',
        },
      ]);
    });

    it('should create updated full trees when removing files', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      api.createTree = jest.fn().mockImplementation(sha => Promise.resolve({ sha }));

      api.getTree = jest.fn().mockImplementation(sha => Promise.resolve(mockedTrees[sha]));

      const files = [{ path: 'static/media/image-3.png', sha: 'image-3.png', remove: true }];
      const fileTree = api.composeFileTree(files);

      await expect(api.updateTree('root', '/', fileTree)).resolves.toEqual({
        mode: '040000',
        parentSha: 'root',
        path: '/',
        sha: 'root',
        type: 'tree',
      });
      expect(api.getTree).toHaveBeenCalledTimes(3);
      expect(api.getTree).toHaveBeenCalledWith('static');
      expect(api.getTree).toHaveBeenCalledWith('media');

      expect(api.createTree).toHaveBeenCalledTimes(3);

      // should create a tree with no based tree and with all images except the one removed
      expect(api.createTree).toHaveBeenCalledWith('media', [
        {
          path: 'image-3.png',
          mode: '100644',
          type: 'blob',
          sha: null,
        },
      ]);

      // media should be a childe of static
      expect(api.createTree).toHaveBeenCalledWith('static', [
        {
          path: 'media',
          mode: '040000',
          type: 'tree',
          sha: 'media',
          parentSha: 'media',
        },
      ]);

      // content and media should be children of root
      expect(api.createTree).toHaveBeenCalledWith('root', [
        {
          path: 'static',
          mode: '040000',
          type: 'tree',
          sha: 'static',
          parentSha: 'static',
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

        // get all relevant trees
        '/repos/owner/repo/git/trees/root': () => mockedTrees['root'],
        '/repos/owner/repo/git/trees/content': () => mockedTrees['content'],
        '/repos/owner/repo/git/trees/posts': () => mockedTrees['posts'],

        // create all relevant trees
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

      expect(api.request).toHaveBeenCalledTimes(10);

      expect(api.request.mock.calls[0]).toEqual([
        '/repos/owner/repo/git/blobs',
        {
          method: 'POST',
          body: JSON.stringify({ content: Base64.encode(entry.raw), encoding: 'base64' }),
        },
      ]);

      expect(api.request.mock.calls[1]).toEqual(['/repos/owner/repo/branches/master']);

      expect(api.request.mock.calls[2]).toEqual(['/repos/owner/repo/git/trees/root']);
      expect(api.request.mock.calls[3]).toEqual(['/repos/owner/repo/git/trees/content']);
      expect(api.request.mock.calls[4]).toEqual(['/repos/owner/repo/git/trees/posts']);

      expect(api.request.mock.calls[5]).toEqual([
        '/repos/owner/repo/git/trees',
        {
          body: JSON.stringify({
            base_tree: 'posts',
            tree: [{ path: 'new-post.md', mode: '100644', type: 'blob', sha: 'new-file-sha' }],
          }),
          method: 'POST',
        },
      ]);
      expect(api.request.mock.calls[6]).toEqual([
        '/repos/owner/repo/git/trees',
        {
          body: JSON.stringify({
            base_tree: 'content',
            tree: [
              { path: 'posts', mode: '040000', type: 'tree', sha: 'posts', parentSha: 'posts' },
            ],
          }),
          method: 'POST',
        },
      ]);
      expect(api.request.mock.calls[7]).toEqual([
        '/repos/owner/repo/git/trees',
        {
          body: JSON.stringify({
            base_tree: 'root',
            tree: [
              {
                path: 'content',
                mode: '040000',
                type: 'tree',
                sha: 'content',
                parentSha: 'content',
              },
            ],
          }),
          method: 'POST',
        },
      ]);

      expect(api.request.mock.calls[8]).toEqual([
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

      expect(api.request.mock.calls[9]).toEqual([
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
});
