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

  describe('editorialWorkflowGit', () => {
    it('should create PR with correct branch when publishing with editorial workflow', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/my-repo',
      });

      // Mock getBranch to indicate branch doesn't exist yet
      api.getBranch = jest.fn().mockRejectedValue(new Error('Branch not found'));
      api.createBranch = jest.fn().mockResolvedValue({ name: 'cms/posts/entry' });

      const changeOperations = [{ operation: 'create', path: 'content.md', content: 'test' }];
      api.getChangeFileOperationsForBranch = jest.fn().mockResolvedValue(changeOperations);
      api.changeFilesOnBranch = jest.fn().mockResolvedValue({});

      const newPr = { number: 1, labels: [], head: { ref: 'cms/posts/entry' } };
      api.createPR = jest.fn().mockResolvedValue(newPr);
      api.setPullRequestStatus = jest.fn().mockResolvedValue();

      const files = [{ path: 'content.md', raw: 'test content' }];
      const options = { commitMessage: 'Add entry', status: 'draft' };

      await api.editorialWorkflowGit(files, 'entry', 'posts', options);

      expect(api.getBranch).toHaveBeenCalledWith('cms/posts/entry');
      expect(api.createBranch).toHaveBeenCalledWith('cms/posts/entry', 'master');
      expect(api.getChangeFileOperationsForBranch).toHaveBeenCalledWith(files, 'cms/posts/entry');
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
      api.getChangeFileOperationsForBranch = jest.fn().mockResolvedValue(changeOperations);
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
          path: 'posts/post.md',
          type: 'blob',
        },
        {
          path: 'posts/dir1',
          type: 'tree',
        },
        {
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
        },
        {
          path: 'posts/dir1/dir2',
          type: 'tree',
        },
        {
          path: 'posts/dir1/dir2/nested-post.md',
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
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master', {
        params: { recursive: 1 },
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
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master', {
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
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master', {
        params: { recursive: 1 },
      });
    });
    it('should get files and folders', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo' });

      const tree = [
        {
          path: 'media/image.png',
          type: 'blob',
        },
        {
          path: 'media/dir1',
          type: 'tree',
        },
        {
          path: 'media/dir1/nested-image.png',
          type: 'blob',
        },
        {
          path: 'media/dir1/dir2',
          type: 'tree',
        },
        {
          path: 'media/dir1/dir2/nested-image.png',
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
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master', {
        params: { recursive: 1 },
      });
    });
    it('should create branch', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({ name: 'cms/new-branch' });

      await expect(api.createBranch('cms/new-branch', 'master')).resolves.toEqual({
        name: 'cms/new-branch',
      });
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/branches', {
        method: 'POST',
        body: JSON.stringify({
          new_branch_name: 'cms/new-branch',
          old_ref_name: 'master',
        }),
      });
    });

    it('should create pull request', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({ number: 1 });

      await expect(
        api.createPR('title', 'cms/new-branch', 'Check out the changes!'),
      ).resolves.toEqual({ number: 1 });
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/pulls', {
        method: 'POST',
        body: JSON.stringify({
          title: 'title',
          head: 'cms/new-branch',
          base: 'gh-pages',
          body: 'Check out the changes!',
        }),
      });
    });

    it('should get pull requests', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue([{ number: 1 }]);

      await expect(api.getPullRequests('open', 'head')).resolves.toEqual([{ number: 1 }]);
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/pulls', {
        params: { state: 'open', head: 'head' },
      });
    });

    it('should list unpublished branches', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest
        .fn()
        .mockResolvedValue([
          { head: { ref: 'cms/branch1' } },
          { head: { ref: 'other/branch' } },
          { head: { ref: 'cms/branch2' } },
        ]);

      await expect(api.listUnpublishedBranches()).resolves.toEqual(['cms/branch1', 'cms/branch2']);
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/pulls', {
        params: { state: 'open' },
      });
    });

    it('should update pull request labels', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue([{ id: 1, name: 'label' }]);

      await expect(api.updatePullRequestLabels(1, [1])).resolves.toEqual([
        { id: 1, name: 'label' },
      ]);
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/issues/1/labels', {
        method: 'PUT',
        body: JSON.stringify({ labels: [1] }),
      });
    });

    it('should get labels', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue([
        { id: 1, name: 'label1' },
        { id: 2, name: 'label2' },
      ]);

      await expect(api.getLabels()).resolves.toEqual([
        { id: 1, name: 'label1' },
        { id: 2, name: 'label2' },
      ]);
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/labels');
    });

    it('should create label', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      api.request = jest.fn().mockResolvedValue({ id: 1, name: 'new-label', color: '0052cc' });

      await expect(api.createLabel('new-label', '0052cc')).resolves.toEqual({
        id: 1,
        name: 'new-label',
        color: '0052cc',
      });
      expect(api.request).toHaveBeenCalledWith('/repos/my-repo/labels', {
        method: 'POST',
        body: JSON.stringify({ name: 'new-label', color: '0052cc' }),
      });
    });

    it('should get or create label when label exists', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      const existingLabel = { id: 1, name: 'existing-label', color: '0052cc' };
      api.getLabels = jest.fn().mockResolvedValue([existingLabel]);
      api.createLabel = jest.fn();

      await expect(api.getOrCreateLabel('existing-label')).resolves.toEqual(existingLabel);
      expect(api.getLabels).toHaveBeenCalledTimes(1);
      expect(api.createLabel).not.toHaveBeenCalled();
    });

    it('should get or create label when label does not exist', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
      const newLabel = { id: 2, name: 'new-label', color: '0052cc' };
      api.getLabels = jest.fn().mockResolvedValue([{ id: 1, name: 'other-label' }]);
      api.createLabel = jest.fn().mockResolvedValue(newLabel);

      await expect(api.getOrCreateLabel('new-label')).resolves.toEqual(newLabel);
      expect(api.getLabels).toHaveBeenCalledTimes(1);
      expect(api.createLabel).toHaveBeenCalledTimes(1);
      expect(api.createLabel).toHaveBeenCalledWith('new-label');
    });

    it('should set pull request status', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'my-repo', token: 'token' });
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
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });

      const pullRequest = {
        number: 1,
        updated_at: '2024-01-01T00:00:00Z',
        user: { login: 'testuser' },
        labels: [{ id: 1, name: 'decap-cms/pending_review' }],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);

      const files = [
        { filename: 'content/posts/test.md', status: 'added' },
        { filename: 'static/img/test.jpg', status: 'modified' },
      ];
      api.getPullRequestFiles = jest.fn().mockResolvedValue(files);

      const result = await api.retrieveUnpublishedEntryData('posts/test');

      expect(api.getBranchPullRequest).toHaveBeenCalledWith('cms/posts/test');
      expect(api.getPullRequestFiles).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        collection: 'posts',
        slug: 'test',
        status: 'pending_review',
        diffs: [
          { path: 'content/posts/test.md', newFile: true, id: '' },
          { path: 'static/img/test.jpg', newFile: false, id: '' },
        ],
        updatedAt: '2024-01-01T00:00:00Z',
        pullRequestAuthor: 'testuser',
      });
    });

    it('should default to draft status when no CMS label found', async () => {
      const api = new API({ branch: 'master', repo: 'owner/repo', token: 'token' });

      const pullRequest = {
        number: 1,
        updated_at: '2024-01-01T00:00:00Z',
        user: { login: 'testuser' },
        labels: [{ id: 2, name: 'other-label' }],
      };
      api.getBranchPullRequest = jest.fn().mockResolvedValue(pullRequest);
      api.getPullRequestFiles = jest.fn().mockResolvedValue([]);

      const result = await api.retrieveUnpublishedEntryData('posts.test');

      expect(result.status).toEqual('draft');
    });
  });

  describe('updateUnpublishedEntryStatus', () => {
    it('should update unpublished entry status', async () => {
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

      api.getBranchPullRequest = jest.fn().mockRejectedValue(new Error('PR not found'));
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
    it('should get open pull request for branch', async () => {
      const api = new API({ branch: 'master', repo: 'owner/my-repo', token: 'token' });

      const openPR = { number: 1, head: { ref: 'cms/posts/test' }, state: 'open' };
      api.getPullRequests = jest.fn().mockResolvedValue([openPR]);

      const result = await api.getBranchPullRequest('cms/posts/test');

      expect(result).toEqual(openPR);
      expect(api.getPullRequests).toHaveBeenCalledWith('open', 'owner:cms/posts/test');
    });

    it('should check closed PRs if no open PR found', async () => {
      const api = new API({ branch: 'master', repo: 'owner/my-repo', token: 'token' });

      const closedPR = { number: 2, head: { ref: 'cms/posts/test' }, state: 'closed' };
      api.getPullRequests = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([closedPR]);

      const result = await api.getBranchPullRequest('cms/posts/test');

      expect(result).toEqual(closedPR);
      expect(api.getPullRequests).toHaveBeenCalledTimes(2);
      expect(api.getPullRequests).toHaveBeenNthCalledWith(1, 'open', 'owner:cms/posts/test');
      expect(api.getPullRequests).toHaveBeenNthCalledWith(2, 'closed', 'owner:cms/posts/test');
    });

    it('should throw error if no PR found', async () => {
      const api = new API({ branch: 'master', repo: 'owner/my-repo', token: 'token' });

      api.getPullRequests = jest.fn().mockResolvedValue([]);

      await expect(api.getBranchPullRequest('cms/posts/test')).rejects.toThrow(
        'Pull request not found',
      );
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
          do: 'merge',
          merge_message_field: 'Automatically generated. Merged on Decap CMS.',
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
    it('should return null when no PR exists', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo' });
      api.getBranch = jest.fn().mockResolvedValue({
        commit: { id: 'sha123' },
      });

      const result = await api.getOpenAuthoringPullRequest('cms/test', []);

      expect(result.pullRequest).toBeNull();
      expect(result.branch.commit.id).toBe('sha123');
    });

    it('should filter CMS labels from PR', async () => {
      const api = new API({ branch: 'master', repo: 'user/repo' });
      const pullRequest = {
        number: 1,
        head: { sha: 'sha123' },
        state: 'open',
        labels: [
          { id: 1, name: 'decap-cms/pending_review' },
          { id: 2, name: 'bug' },
        ],
      };
      api.getBranch = jest.fn().mockResolvedValue({
        commit: { id: 'sha123' },
      });

      const result = await api.getOpenAuthoringPullRequest('cms/test', [pullRequest]);

      expect(result.pullRequest.number).toBe(1);
      expect(result.pullRequest.labels).toEqual([{ id: 2, name: 'bug' }]);
    });
  });
});
