import { Base64 } from 'js-base64';
import { APIError, EditorialWorkflowError } from 'decap-cms-lib-util';

import API, { MOCK_PULL_REQUEST } from '../API';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('forgejo API', () => {
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

  describe('generateContentKey and parseContentKey', () => {
    it('should generate standard content key without OA', () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      const key = api.generateContentKey('posts', 'my-post');
      expect(key).toEqual('posts/my-post');
    });

    it('should generate OA content key with repo prefix', () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });
      const key = api.generateContentKey('posts', 'my-post');
      expect(key).toEqual('contributor/repo/posts/my-post');
    });

    it('should parse standard content key without OA', () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      const result = api.parseContentKey('posts/my-post');
      expect(result).toEqual({ collection: 'posts', slug: 'my-post' });
    });

    it('should parse OA content key by stripping repo prefix', () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });
      const result = api.parseContentKey('contributor/repo/posts/my-post');
      expect(result).toEqual({ collection: 'posts', slug: 'my-post' });
    });
  });

  describe('getHeadReference', () => {
    it('should return owner:branch format', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });
      const ref = await api.getHeadReference('cms/posts/test');
      expect(ref).toEqual('owner:cms/posts/test');
    });
  });

  describe('editorialWorkflowGit', () => {
    it('should create PR with correct branch when publishing with editorial workflow', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/my-repo',
      });

      // Mock getBranch to indicate branch doesn't exist yet
      api.getBranch = jest.fn().mockRejectedValue(new APIError('Branch not found', 404, 'Forgejo'));
      api.createBranch = jest.fn().mockResolvedValue({ name: 'cms/posts/entry' });

      const changeOperations = [{ operation: 'create', path: 'content.md', content: 'test' }];
      api.getChangeFileOperations = jest.fn().mockResolvedValue(changeOperations);
      api.changeFilesOnBranch = jest.fn().mockResolvedValue({});

      const newPr = { number: 1, labels: [], head: { ref: 'cms/posts/entry' } };
      api.createPR = jest.fn().mockResolvedValue(newPr);
      api.setPullRequestStatus = jest.fn().mockResolvedValue();

      const files = [{ path: 'content.md', raw: 'test content' }];
      const options = { commitMessage: 'Add entry', status: 'draft' };

      await api.editorialWorkflowGit(files, 'entry', 'posts', options);

      expect(api.getBranch).toHaveBeenCalledWith('cms/posts/entry');
      expect(api.createBranch).toHaveBeenCalledWith('cms/posts/entry', 'master');
      expect(api.getChangeFileOperations).toHaveBeenCalledWith(files, 'cms/posts/entry');
      expect(api.changeFilesOnBranch).toHaveBeenCalledWith(
        changeOperations,
        options,
        'cms/posts/entry',
      );
      expect(api.createPR).toHaveBeenCalledWith('Add entry', 'cms/posts/entry');
      expect(api.setPullRequestStatus).toHaveBeenCalledWith(newPr, 'draft');
    });

    it('should not create branch if it already exists', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/my-repo',
      });

      // Mock getBranch to indicate branch already exists
      api.getBranch = jest.fn().mockResolvedValue({ name: 'cms/posts/entry' });
      api.createBranch = jest.fn();

      const changeOperations = [{ operation: 'update', path: 'content.md', content: 'updated' }];
      api.getChangeFileOperations = jest.fn().mockResolvedValue(changeOperations);
      api.changeFilesOnBranch = jest.fn().mockResolvedValue({});

      api.createPR = jest.fn();
      api.setPullRequestStatus = jest.fn();

      const files = [{ path: 'content.md', raw: 'updated content' }];
      const options = { commitMessage: 'Update entry' };

      await api.editorialWorkflowGit(files, 'entry', 'posts', options);

      expect(api.getBranch).toHaveBeenCalledWith('cms/posts/entry');
      expect(api.createBranch).not.toHaveBeenCalled();
      expect(api.createPR).not.toHaveBeenCalled();
      expect(api.setPullRequestStatus).not.toHaveBeenCalled();
    });

    it('should not create PR for open authoring (branch-only draft)', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      api.getBranch = jest.fn().mockRejectedValue(new APIError('Branch not found', 404, 'Forgejo'));
      api.createBranch = jest.fn().mockResolvedValue({ name: 'cms/contributor/repo/posts/entry' });

      const changeOperations = [{ operation: 'create', path: 'content.md', content: 'test' }];
      api.getChangeFileOperations = jest.fn().mockResolvedValue(changeOperations);
      api.changeFilesOnBranch = jest.fn().mockResolvedValue({});

      api.createPR = jest.fn();
      api.setPullRequestStatus = jest.fn();

      const files = [{ path: 'content.md', raw: 'test content' }];
      const options = { commitMessage: 'Add entry', status: 'draft' };

      await api.editorialWorkflowGit(files, 'entry', 'posts', options);

      expect(api.createBranch).toHaveBeenCalled();
      expect(api.createPR).not.toHaveBeenCalled();
      expect(api.setPullRequestStatus).not.toHaveBeenCalled();
    });
  });

  describe('request', () => {
    const fetch = jest.fn();
    beforeEach(() => {
      global.fetch = fetch;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch url with authorization header', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'https://v14.next.forgejo.org/api/v1/some-path',
        expect.objectContaining({
          cache: 'no-cache',
          headers: {
            Authorization: 'token token',
            'Content-Type': 'application/json; charset=utf-8',
          },
        }),
      );
    });

    it('should throw error on not ok response', async () => {
      const api = new API({ branch: 'gt-pages', repo: 'owner/my-repo', token: 'token' });

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
          api: 'Forgejo',
        }),
      );
    });

    it('should allow overriding requestHeaders to return a promise ', async () => {
      const api = new API({ branch: 'gt-pages', repo: 'owner/my-repo', token: 'token' });

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
      expect(fetch).toHaveBeenCalledWith(
        'https://v14.next.forgejo.org/api/v1/some-path',
        expect.objectContaining({
          cache: 'no-cache',
          headers: {
            Authorization: 'promise-token',
            'Content-Type': 'application/json; charset=utf-8',
          },
        }),
      );
    });
  });

  describe('persistFiles', () => {
    it('should create a new commit', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const responses = {
        '/repos/owner/repo/contents/content/posts/update-post.md': () => {
          return { sha: 'old-sha' };
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
        '/repos/owner/repo/contents/content/posts/new-post.md',
        { params: { ref: 'master' } },
      ]);

      expect(api.request.mock.calls[1]).toEqual([
        '/repos/owner/repo/contents/content/posts/update-post.md',
        { params: { ref: 'master' } },
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
        '/repos/owner/repo/contents/content/posts/delete-post-1.md': () => {
          return { sha: 'old-sha-1' };
        },
        '/repos/owner/repo/contents/content/posts/delete-post-2.md': () => {
          return { sha: 'old-sha-2' };
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
        '/repos/owner/repo/contents/content/posts/delete-post-1.md',
        { params: { ref: 'master' } },
      ]);

      expect(api.request.mock.calls[1]).toEqual([
        '/repos/owner/repo/contents/content/posts/delete-post-2.md',
        { params: { ref: 'master' } },
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

    it('should reject delete for open authoring users', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      await expect(api.deleteFiles(['content/posts/post.md'], 'delete post')).rejects.toMatchObject(
        {
          message: 'Cannot delete published entries as an Open Authoring user!',
          status: 403,
        },
      );
    });
  });

  describe('listFiles', () => {
    it('should get files by depth', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const tree = [
        {
          path: 'posts/post.md',
          sha: 'sha-post',
          size: 10,
          type: 'blob',
        },
        {
          path: 'posts/dir1',
          sha: 'sha-dir1',
          size: 0,
          type: 'tree',
        },
        {
          path: 'posts/dir1/nested-post.md',
          sha: 'sha-nested-1',
          size: 20,
          type: 'blob',
        },
        {
          path: 'posts/dir1/dir2',
          sha: 'sha-dir2',
          size: 0,
          type: 'tree',
        },
        {
          path: 'posts/dir1/dir2/nested-post.md',
          sha: 'sha-nested-2',
          size: 30,
          type: 'blob',
        },
      ];
      api.request = jest
        .fn()
        .mockResolvedValueOnce({ commit: { id: 'sha123' } })
        .mockResolvedValueOnce({ tree });

      await expect(api.listFiles('posts', { depth: 1 })).resolves.toEqual([
        {
          id: 'sha-post',
          size: 10,
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(2);
      expect(api.request).toHaveBeenNthCalledWith(1, '/repos/owner/repo/branches/master');
      expect(api.request).toHaveBeenNthCalledWith(2, '/repos/owner/repo/git/trees/sha123', {
        params: { recursive: 1 },
      });

      jest.clearAllMocks();
      api.request = jest
        .fn()
        .mockResolvedValueOnce({ commit: { id: 'sha123' } })
        .mockResolvedValueOnce({ tree });
      await expect(api.listFiles('posts', { depth: 2 })).resolves.toEqual([
        {
          id: 'sha-post',
          size: 10,
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
        {
          id: 'sha-nested-1',
          size: 20,
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(2);
      expect(api.request).toHaveBeenNthCalledWith(1, '/repos/owner/repo/branches/master');
      expect(api.request).toHaveBeenNthCalledWith(2, '/repos/owner/repo/git/trees/sha123', {
        params: { recursive: 1 },
      });

      jest.clearAllMocks();
      api.request = jest
        .fn()
        .mockResolvedValueOnce({ commit: { id: 'sha123' } })
        .mockResolvedValueOnce({ tree });
      await expect(api.listFiles('posts', { depth: 3 })).resolves.toEqual([
        {
          id: 'sha-post',
          size: 10,
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
        {
          id: 'sha-nested-1',
          size: 20,
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
        {
          id: 'sha-nested-2',
          size: 30,
          path: 'posts/dir1/dir2/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(2);
      expect(api.request).toHaveBeenNthCalledWith(1, '/repos/owner/repo/branches/master');
      expect(api.request).toHaveBeenNthCalledWith(2, '/repos/owner/repo/git/trees/sha123', {
        params: { recursive: 1 },
      });
    });
    it('should get files and folders', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const tree = [
        {
          path: 'media/image.png',
          sha: 'sha-image',
          size: 50,
          type: 'blob',
        },
        {
          path: 'media/dir1',
          sha: 'sha-media-dir1',
          size: 0,
          type: 'tree',
        },
        {
          path: 'media/dir1/nested-image.png',
          sha: 'sha-media-nested-1',
          size: 60,
          type: 'blob',
        },
        {
          path: 'media/dir1/dir2',
          sha: 'sha-media-dir2',
          size: 0,
          type: 'tree',
        },
        {
          path: 'media/dir1/dir2/nested-image.png',
          sha: 'sha-media-nested-2',
          size: 70,
          type: 'blob',
        },
      ];
      api.request = jest
        .fn()
        .mockResolvedValueOnce({ commit: { id: 'sha123' } })
        .mockResolvedValueOnce({ tree });

      await expect(api.listFiles('media', {}, true)).resolves.toEqual([
        {
          id: 'sha-image',
          size: 50,
          path: 'media/image.png',
          type: 'blob',
          name: 'image.png',
        },
        {
          id: 'sha-media-dir1',
          size: 0,
          path: 'media/dir1',
          type: 'tree',
          name: 'dir1',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(2);
      expect(api.request).toHaveBeenNthCalledWith(1, '/repos/owner/repo/branches/master');
      expect(api.request).toHaveBeenNthCalledWith(2, '/repos/owner/repo/git/trees/sha123', {
        params: { recursive: 1 },
      });
    });

    it('should create branch', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({ name: 'cms/new-branch' });

      await expect(api.createBranch('cms/new-branch', 'master')).resolves.toEqual({
        name: 'cms/new-branch',
      });
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/branches', {
        method: 'POST',
        body: JSON.stringify({
          new_branch_name: 'cms/new-branch',
          old_ref_name: 'master',
        }),
      });
    });

    it('should create pull request with owner:branch head format', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({ number: 1 });

      await expect(
        api.createPR('title', 'cms/new-branch', 'Check out the changes!'),
      ).resolves.toEqual({ number: 1 });
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/pulls', {
        method: 'POST',
        body: JSON.stringify({
          title: 'title',
          head: 'owner:cms/new-branch',
          base: 'gh-pages',
          body: 'Check out the changes!',
        }),
      });
    });

    it('should get pull requests', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue([{ number: 1, head: { label: 'head' } }]);

      await expect(api.getPullRequests('open', 'head')).resolves.toEqual([
        { number: 1, head: { label: 'head' } },
      ]);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/pulls', {
        params: { state: 'open' },
      });
    });

    it('should list unpublished branches (standard mode)', async () => {
      const api = new API({
        branch: 'gh-pages',
        repo: 'owner/my-repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });
      api.request = jest.fn().mockResolvedValue([
        { head: { ref: 'cms/branch1' }, labels: [{ name: 'decap-cms/draft' }] },
        { head: { ref: 'other/branch' }, labels: [{ name: 'decap-cms/draft' }] },
        { head: { ref: 'cms/branch2' }, labels: [{ name: 'decap-cms/pending_review' }] },
        { head: { ref: 'cms/branch3' }, labels: [{ name: 'other-label' }] },
      ]);

      await expect(api.listUnpublishedBranches()).resolves.toEqual(['cms/branch1', 'cms/branch2']);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/pulls', {
        params: { state: 'open' },
      });
    });

    it('should list unpublished branches (OA mode) from fork branches', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        token: 'token',
        useOpenAuthoring: true,
      });

      // Mock getOpenAuthoringBranches
      api.getOpenAuthoringBranches = jest
        .fn()
        .mockResolvedValue([
          { name: 'cms/contributor/repo/posts/entry1' },
          { name: 'cms/contributor/repo/posts/entry2' },
        ]);

      // Mock filterOpenAuthoringBranches to allow all
      api.filterOpenAuthoringBranches = jest
        .fn()
        .mockImplementation(branch => Promise.resolve({ branch, filter: true }));

      const result = await api.listUnpublishedBranches();

      expect(result).toEqual([
        'cms/contributor/repo/posts/entry1',
        'cms/contributor/repo/posts/entry2',
      ]);
      expect(api.getOpenAuthoringBranches).toHaveBeenCalled();
    });

    it('should update pull request labels', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue([{ id: 1, name: 'label' }]);

      await expect(api.updatePullRequestLabels(1, [1])).resolves.toEqual([
        { id: 1, name: 'label' },
      ]);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/issues/1/labels', {
        method: 'PUT',
        body: JSON.stringify({ labels: [1] }),
      });
    });

    it('should get labels', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue([
        { id: 1, name: 'label1' },
        { id: 2, name: 'label2' },
      ]);

      await expect(api.getLabels()).resolves.toEqual([
        { id: 1, name: 'label1' },
        { id: 2, name: 'label2' },
      ]);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/labels');
    });

    it('should create label', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({ id: 1, name: 'new-label', color: '0052cc' });

      await expect(api.createLabel('new-label', '0052cc')).resolves.toEqual({
        id: 1,
        name: 'new-label',
        color: '0052cc',
      });
      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/labels', {
        method: 'POST',
        body: JSON.stringify({ name: 'new-label', color: '0052cc' }),
      });
    });

    it('should get or create label when label exists', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      const existingLabel = { id: 1, name: 'existing-label', color: '0052cc' };
      api.getLabels = jest.fn().mockResolvedValue([existingLabel]);
      api.createLabel = jest.fn();

      await expect(api.getOrCreateLabel('existing-label')).resolves.toEqual(existingLabel);
      expect(api.getLabels).toHaveBeenCalledTimes(1);
      expect(api.createLabel).not.toHaveBeenCalled();
    });

    it('should get or create label when label does not exist', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' });
      const newLabel = { id: 2, name: 'new-label', color: '0052cc' };
      api.getLabels = jest.fn().mockResolvedValue([{ id: 1, name: 'other-label' }]);
      api.createLabel = jest.fn().mockResolvedValue(newLabel);

      await expect(api.getOrCreateLabel('new-label')).resolves.toEqual(newLabel);
      expect(api.getLabels).toHaveBeenCalledTimes(1);
      expect(api.createLabel).toHaveBeenCalledTimes(1);
      expect(api.createLabel).toHaveBeenCalledWith('new-label');
    });

    it('should set pull request status', async () => {
      const api = new API({
        branch: 'gh-pages',
        repo: 'owner/my-repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });
      const pullRequest = {
        number: 1,
        labels: [
          { id: 1, name: 'decap-cms/draft' },
          { id: 2, name: 'other-label' },
        ],
      };

      const newLabel = { id: 3, name: 'decap-cms/pending_review' };
      api.getOrCreateLabel = jest.fn().mockResolvedValue(newLabel);
      api.updatePullRequestLabels = jest
        .fn()
        .mockResolvedValue([newLabel, { id: 2, name: 'other-label' }]);

      await api.setPullRequestStatus(pullRequest, 'pending_review');

      expect(api.getOrCreateLabel).toHaveBeenCalledTimes(1);
      expect(api.getOrCreateLabel).toHaveBeenCalledWith('decap-cms/pending_review');

      expect(api.updatePullRequestLabels).toHaveBeenCalledTimes(1);
      expect(api.updatePullRequestLabels).toHaveBeenCalledWith(1, [2, 3]);
    });
  });

  describe('retrieveUnpublishedEntryData', () => {
    it('should retrieve unpublished entry data', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });

      const pullRequest = {
        number: 1,
        updated_at: '2024-01-01T00:00:00Z',
        user: { login: 'testuser' },
        labels: [{ id: 1, name: 'decap-cms/pending_review' }],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);

      const compareResult = {
        files: [
          { filename: 'content/posts/test.md', status: 'added', sha: 'sha1' },
          { filename: 'static/img/test.jpg', status: 'modified', sha: 'sha2' },
        ],
        commits: [],
        total_commits: 1,
      };
      api.getDifferences = jest.fn().mockResolvedValue(compareResult);

      const result = await api.retrieveUnpublishedEntryData('posts/test');

      expect(api.getBranchPullRequest).toHaveBeenCalledWith('cms/posts/test');
      expect(result).toEqual({
        collection: 'posts',
        slug: 'test',
        status: 'pending_review',
        diffs: [
          { path: 'content/posts/test.md', newFile: true, id: 'sha1' },
          { path: 'static/img/test.jpg', newFile: false, id: 'sha2' },
        ],
        updatedAt: '2024-01-01T00:00:00Z',
        pullRequestAuthor: 'testuser',
      });
    });

    it('should fall back to getPullRequestFiles when getDifferences fails', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });

      const pullRequest = {
        number: 1,
        updated_at: '2024-01-01T00:00:00Z',
        user: { login: 'testuser' },
        labels: [{ id: 1, name: 'decap-cms/pending_review' }],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.getDifferences = jest.fn().mockRejectedValue(new Error('compare failed'));

      const files = [{ filename: 'content/posts/test.md', status: 'added' }];
      api.getPullRequestFiles = jest.fn().mockResolvedValue(files);

      const result = await api.retrieveUnpublishedEntryData('posts/test');

      expect(result.diffs).toEqual([{ path: 'content/posts/test.md', newFile: true, id: '' }]);
    });

    it('should default to initialWorkflowStatus when no CMS label found', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });

      const pullRequest = {
        number: 1,
        updated_at: '2024-01-01T00:00:00Z',
        user: { login: 'testuser' },
        labels: [{ id: 2, name: 'other-label' }],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.getDifferences = jest
        .fn()
        .mockResolvedValue({ files: [], commits: [], total_commits: 0 });

      const result = await api.retrieveUnpublishedEntryData('posts/test');

      expect(result.status).toEqual('draft');
    });
  });

  describe('updateUnpublishedEntryStatus', () => {
    it('should update unpublished entry status (standard mode)', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });

      const pullRequest = {
        number: 1,
        labels: [{ id: 1, name: 'decap-cms/draft' }],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.setPullRequestStatus = jest.fn().mockResolvedValue();

      await api.updateUnpublishedEntryStatus('posts', 'test', 'pending_review');

      expect(api.getBranchPullRequest).toHaveBeenCalledWith('cms/posts/test');
      expect(api.setPullRequestStatus).toHaveBeenCalledWith(pullRequest, 'pending_review');
    });

    it('should reject pending_publish for open authoring', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const pullRequest = { number: 1, state: 'open', labels: [] };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);

      await expect(
        api.updateUnpublishedEntryStatus('posts', 'test', 'pending_publish'),
      ).rejects.toThrow('Open Authoring entries may not be set to the status "pending_publish".');
    });

    it('should close PR when OA entry moves to draft', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const pullRequest = { number: 5, state: 'open', labels: [] };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.closePR = jest.fn().mockResolvedValue({});

      await api.updateUnpublishedEntryStatus('posts', 'test', 'draft');

      expect(api.closePR).toHaveBeenCalledWith(5);
    });

    it('should re-open PR when OA entry moves to pending_review', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const pullRequest = { number: 5, state: 'closed', labels: [] };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.updatePR = jest.fn().mockResolvedValue({});

      await api.updateUnpublishedEntryStatus('posts', 'test', 'pending_review');

      expect(api.updatePR).toHaveBeenCalledWith(5, 'open');
    });

    it('should create PR from mock PR when OA entry moves to pending_review', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const mockPR = { number: MOCK_PULL_REQUEST, state: 'open', labels: [] };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(mockPR);
      api.getDifferences = jest.fn().mockResolvedValue({
        commits: [{ commit: { message: 'Add new post' } }],
        files: [],
        total_commits: 1,
      });
      api.createPR = jest.fn().mockResolvedValue({ number: 10 });

      await api.updateUnpublishedEntryStatus('posts', 'test', 'pending_review');

      expect(api.getDifferences).toHaveBeenCalled();
      expect(api.createPR).toHaveBeenCalledWith('Add new post', expect.stringContaining('cms/'));
    });
  });

  describe('deleteUnpublishedEntry', () => {
    it('should delete unpublished entry by closing PR and deleting branch', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });

      const pullRequest = { number: 1 };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.closePR = jest.fn().mockResolvedValue();
      api.deleteBranch = jest.fn().mockResolvedValue();

      await api.deleteUnpublishedEntry('posts', 'test');

      expect(api.getBranchPullRequest).toHaveBeenCalledWith('cms/posts/test');
      expect(api.closePR).toHaveBeenCalledWith(1);
      expect(api.deleteBranch).toHaveBeenCalledWith('cms/posts/test');
    });

    it('should delete branch even if PR does not exist', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });

      api.getBranchPullRequest = jest
        .fn()
        .mockRejectedValue(new APIError('PR not found', 404, 'Forgejo'));
      api.closePR = jest.fn();
      api.deleteBranch = jest.fn().mockResolvedValue();

      await api.deleteUnpublishedEntry('posts', 'test');

      expect(api.closePR).not.toHaveBeenCalled();
      expect(api.deleteBranch).toHaveBeenCalledWith('cms/posts/test');
    });
  });

  describe('publishUnpublishedEntry', () => {
    it('should publish unpublished entry by merging PR and deleting branch', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });

      const pullRequest = { number: 1 };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.mergePR = jest.fn().mockResolvedValue();
      api.deleteBranch = jest.fn().mockResolvedValue();

      await api.publishUnpublishedEntry('posts', 'test');

      expect(api.getBranchPullRequest).toHaveBeenCalledWith('cms/posts/test');
      expect(api.mergePR).toHaveBeenCalledWith(pullRequest);
      expect(api.deleteBranch).toHaveBeenCalledWith('cms/posts/test');
    });
  });

  describe('getBranchPullRequest', () => {
    it('should get open pull request with CMS labels for branch (standard mode)', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/my-repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });

      const openPR = {
        number: 1,
        head: { ref: 'cms/posts/test' },
        state: 'open',
        labels: [{ name: 'decap-cms/draft' }],
      };
      api.getPullRequests = jest.fn().mockResolvedValue([openPR]);

      const result = await api.getBranchPullRequest('cms/posts/test');

      expect(result).toEqual(openPR);
      expect(api.getPullRequests).toHaveBeenCalledWith('open', 'owner:cms/posts/test');
    });

    it('should throw EditorialWorkflowError if no CMS-labeled PR found (standard mode)', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/my-repo',
        token: 'token',
        cmsLabelPrefix: 'decap-cms/',
      });

      // PR exists but has no CMS label
      const pr = {
        number: 1,
        head: { ref: 'cms/posts/test' },
        state: 'open',
        labels: [{ name: 'other-label' }],
      };
      api.getPullRequests = jest.fn().mockResolvedValue([pr]);

      await expect(api.getBranchPullRequest('cms/posts/test')).rejects.toThrow(
        'content is not under editorial workflow',
      );
    });

    it('should delegate to getOpenAuthoringPullRequest for OA mode', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        token: 'token',
        useOpenAuthoring: true,
      });

      const mockPR = {
        number: MOCK_PULL_REQUEST,
        state: 'open',
        labels: [],
        head: { ref: 'cms/test', sha: 'sha123' },
      };
      api.getPullRequests = jest.fn().mockResolvedValue([]);
      api.getOpenAuthoringPullRequest = jest.fn().mockResolvedValue({
        pullRequest: mockPR,
        branch: { commit: { id: 'sha123' } },
      });

      const result = await api.getBranchPullRequest('cms/test');

      expect(result).toEqual(mockPR);
      expect(api.getPullRequests).toHaveBeenCalledWith('all', 'contributor:cms/test');
    });
  });

  describe('mergePR', () => {
    it('should merge pull request', async () => {
      const api = new API({ branch: 'master', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({});

      const pullRequest = { number: 1 };
      await api.mergePR(pullRequest);

      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/pulls/1/merge', {
        method: 'POST',
        body: JSON.stringify({
          Do: 'merge',
          MergeMessageField: 'Automatically generated. Merged on Decap CMS.',
        }),
      });
    });
  });

  describe('closePR', () => {
    it('should close pull request', async () => {
      const api = new API({ branch: 'master', repo: 'owner/my-repo', token: 'token' });
      api.updatePR = jest.fn().mockResolvedValue({ number: 1, state: 'closed' });

      const result = await api.closePR(1);

      expect(api.updatePR).toHaveBeenCalledWith(1, 'closed');
      expect(result).toEqual({ number: 1, state: 'closed' });
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch', async () => {
      const api = new API({ branch: 'master', repo: 'owner/my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({});

      await api.deleteBranch('cms/posts/test');

      expect(api.request).toHaveBeenCalledWith('/repos/owner/my-repo/branches/cms%2Fposts%2Ftest', {
        method: 'DELETE',
      });
    });
  });

  describe('forkExists', () => {
    it('should return true when fork exists with matching parent', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo', originRepo: 'owner/repo' });
      const mockRepo = {
        fork: true,
        parent: { full_name: 'owner/repo' },
      };
      api.request = jest.fn().mockResolvedValue(mockRepo);

      const result = await api.forkExists();

      expect(result).toBe(true);
      expect(api.request).toHaveBeenCalledWith('/repos/user/repo');
    });

    it('should return false when repo is not a fork', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo', originRepo: 'owner/repo' });
      api.request = jest.fn().mockResolvedValue({ fork: false });

      const result = await api.forkExists();

      expect(result).toBe(false);
    });

    it('should return false when parent does not match origin repo', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo', originRepo: 'owner/repo' });
      api.request = jest.fn().mockResolvedValue({
        fork: true,
        parent: { full_name: 'other/repo' },
      });

      const result = await api.forkExists();

      expect(result).toBe(false);
    });

    it('should handle case-insensitive parent comparison', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo', originRepo: 'owner/repo' });
      api.request = jest.fn().mockResolvedValue({
        fork: true,
        parent: { full_name: 'OWNER/REPO' },
      });

      const result = await api.forkExists();

      expect(result).toBe(true);
    });
  });

  describe('createFork', () => {
    it('should create fork', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo', originRepo: 'owner/repo' });
      api.request = jest.fn().mockResolvedValue({ full_name: 'user/repo' });

      const result = await api.createFork();

      expect(result).toEqual({ full_name: 'user/repo' });
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/forks', {
        method: 'POST',
      });
    });
  });

  describe('getOpenAuthoringPullRequest', () => {
    it('should return mock PR with initial status label when no PR exists', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo' });
      api.getBranch = jest.fn().mockResolvedValue({
        commit: { id: 'sha123' },
      });

      const result = await api.getOpenAuthoringPullRequest('cms/test', []);

      expect(result.pullRequest.number).toBe(-1);
      expect(result.pullRequest.head.sha).toBe('sha123');
      // Default cmsLabelPrefix is '' which maps to 'decap-cms/' via getLabelPrefix
      expect(result.pullRequest.labels).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'decap-cms/draft' })]),
      );
      expect(result.branch.commit.id).toBe('sha123');
    });

    it('should add synthetic pending_review label for open PR', async () => {
      const api = new API({
        branch: 'master',
        repo: 'user/repo',
        cmsLabelPrefix: 'decap-cms/',
      });
      const pullRequest = {
        number: 1,
        head: { sha: 'sha123' },
        state: 'open',
        labels: [
          { id: 1, name: 'decap-cms/draft' },
          { id: 2, name: 'bug' },
        ],
      };
      api.getBranch = jest.fn().mockResolvedValue({
        commit: { id: 'sha123' },
      });

      const result = await api.getOpenAuthoringPullRequest('cms/test', [pullRequest]);

      expect(result.pullRequest.number).toBe(1);
      // CMS labels filtered out, synthetic pending_review added, plus non-CMS labels kept
      expect(result.pullRequest.labels).toEqual([
        { id: 2, name: 'bug' },
        { name: 'decap-cms/pending_review' },
      ]);
    });

    it('should add synthetic draft label for closed PR', async () => {
      const api = new API({
        branch: 'master',
        repo: 'user/repo',
        cmsLabelPrefix: 'decap-cms/',
      });
      const pullRequest = {
        number: 1,
        head: { sha: 'sha123' },
        state: 'closed',
        labels: [],
      };
      api.getBranch = jest.fn().mockResolvedValue({
        commit: { id: 'sha123' },
      });

      const result = await api.getOpenAuthoringPullRequest('cms/test', [pullRequest]);

      expect(result.pullRequest.labels).toEqual([{ name: 'decap-cms/draft' }]);
    });
  });

  describe('getDifferences', () => {
    it('should call compare endpoint', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });
      const compareResult = { files: [], commits: [], total_commits: 0 };
      api.request = jest.fn().mockResolvedValue(compareResult);

      const result = await api.getDifferences('master', 'owner:cms/posts/test');

      expect(result).toEqual(compareResult);
      expect(api.request).toHaveBeenCalledWith(
        '/repos/owner/repo/compare/master...owner%3Acms%2Fposts%2Ftest',
      );
    });

    it('should retry with origin repo for OA on failure', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
        token: 'token',
      });
      const compareResult = { files: [], commits: [], total_commits: 0 };
      api.request = jest
        .fn()
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(compareResult);

      const result = await api.getDifferences('master', 'contributor:cms/test');

      expect(result).toEqual(compareResult);
      expect(api.request).toHaveBeenCalledTimes(2);
      // First call to fork repo
      expect(api.request.mock.calls[0][0]).toContain('/repos/contributor/repo/compare/');
      // Second call to origin repo
      expect(api.request.mock.calls[1][0]).toContain('/repos/owner/repo/compare/');
    });
  });

  describe('filterOpenAuthoringBranches', () => {
    it('should filter out merged PRs and delete their branches', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const mergedPR = {
        number: 1,
        state: 'closed',
        merged_at: '2024-01-01T00:00:00Z',
        labels: [],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(mergedPR);
      api.deleteBranch = jest.fn().mockResolvedValue();

      const result = await api.filterOpenAuthoringBranches('cms/contributor/repo/posts/entry');

      expect(result).toEqual({ branch: 'cms/contributor/repo/posts/entry', filter: false });
      expect(api.deleteBranch).toHaveBeenCalledWith('cms/contributor/repo/posts/entry');
    });

    it('should keep branches with unmerged PRs', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const openPR = { number: 1, state: 'open', merged_at: null, labels: [] };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(openPR);

      const result = await api.filterOpenAuthoringBranches('cms/contributor/repo/posts/entry');

      expect(result).toEqual({ branch: 'cms/contributor/repo/posts/entry', filter: true });
    });

    it('should keep branches with mock PRs (no real PR)', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const mockPR = { number: MOCK_PULL_REQUEST, state: 'open', merged_at: null, labels: [] };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(mockPR);

      const result = await api.filterOpenAuthoringBranches('cms/contributor/repo/posts/entry');

      expect(result).toEqual({ branch: 'cms/contributor/repo/posts/entry', filter: true });
    });

    it('should filter out branches on 404 errors', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const notFoundError = new APIError('Not found', 404, 'Forgejo');
      api.getBranchPullRequest = jest.fn().mockRejectedValue(notFoundError);

      const result = await api.filterOpenAuthoringBranches('cms/contributor/repo/posts/entry');

      expect(result).toEqual({ branch: 'cms/contributor/repo/posts/entry', filter: false });
    });

    it('should filter out branches on EditorialWorkflowError', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const workflowError = new EditorialWorkflowError(
        'content is not under editorial workflow',
        true,
      );
      api.getBranchPullRequest = jest.fn().mockRejectedValue(workflowError);

      const result = await api.filterOpenAuthoringBranches('cms/contributor/repo/posts/entry');

      expect(result).toEqual({ branch: 'cms/contributor/repo/posts/entry', filter: false });
    });

    it('should keep branches on transient network errors', async () => {
      const api = new API({
        branch: 'master',
        repo: 'contributor/repo',
        originRepo: 'owner/repo',
        useOpenAuthoring: true,
      });

      const networkError = new APIError('Network error', 500, 'Forgejo');
      api.getBranchPullRequest = jest.fn().mockRejectedValue(networkError);

      const result = await api.filterOpenAuthoringBranches('cms/contributor/repo/posts/entry');

      expect(result).toEqual({ branch: 'cms/contributor/repo/posts/entry', filter: true });
    });
  });
});
