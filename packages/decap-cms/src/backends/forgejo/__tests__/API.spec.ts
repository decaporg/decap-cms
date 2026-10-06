import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import API, { MOCK_PULL_REQUEST } from '@/backends/forgejo/API';
import { APIError } from '@/lib/util/index';

global.fetch = vi.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('forgejo API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockAPI(api, responses) {
    api.request = vi.fn().mockImplementation((path, options = {}) => {
      const normalizedPath = path.indexOf('?') !== -1 ? path.slice(0, path.indexOf('?')) : path;
      const response = responses[normalizedPath];
      return typeof response === 'function'
        ? Promise.resolve(response(options))
        : Promise.reject(new Error(`No response for path '${normalizedPath}'`));
    });
  }

  describe('request', () => {
    const fetch = vi.fn();
    beforeEach(() => {
      global.fetch = fetch;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch url with authorization header', async () => {
      const api = new API({
        branch: 'main',
        repo: 'my-repo',
        token: 'token',
        apiRoot: 'https://codeberg.org/api/v1',
      });

      fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://codeberg.org/api/v1/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'token token',
          'Content-Type': 'application/json; charset=utf-8',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should throw error on not ok response', async () => {
      const api = new API({ branch: 'main', repo: 'my-repo', token: 'token' });

      fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue({ message: 'some error' }),
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
  });

  describe('persistFiles', () => {
    it('should create a new commit on the default branch', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });

      const responses = {
        '/repos/owner/repo/git/trees/main:content%2Fposts': () => {
          return { tree: [{ path: 'update-post.md', sha: 'old-sha' }] };
        },

        '/repos/owner/repo/contents': () => ({
          commit: { sha: 'new-sha' },
          files: [
            { path: 'content/posts/new-post.md' },
            { path: 'content/posts/update-post.md' },
          ],
        }),
      };
      mockAPI(api, responses);

      const entry = {
        dataFiles: [
          { slug: 'entry', path: 'content/posts/new-post.md', raw: 'content' },
          { slug: 'entry', sha: 'old-sha', path: 'content/posts/update-post.md', raw: 'content' },
        ],
        assets: [],
      };
      await expect(
        api.persistFiles(entry.dataFiles, entry.assets, { commitMessage: 'commitMessage' }),
      ).resolves.toEqual({
        commit: { sha: 'new-sha' },
        files: [
          { path: 'content/posts/new-post.md' },
          { path: 'content/posts/update-post.md' },
        ],
      });

      expect(api.request.mock.calls[2]).toEqual([
        '/repos/owner/repo/contents',
        {
          method: 'POST',
          body: JSON.stringify({
            branch: 'main',
            files: [
              {
                operation: 'create',
                content: btoa(entry.dataFiles[0].raw),
                path: entry.dataFiles[0].path,
              },
              {
                operation: 'update',
                content: btoa(entry.dataFiles[1].raw),
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
      const api = new API({ branch: 'main', repo: 'owner/repo' });

      const responses = {
        '/repos/owner/repo/git/trees/main:content%2Fposts': () => ({
          tree: [{ path: 'delete-post-1.md', sha: 'old-sha-1' }],
        }),
        '/repos/owner/repo/contents': () => ({
          commit: { sha: 'new-sha' },
          files: [{ path: 'content/posts/delete-post-1.md' }],
        }),
      };
      mockAPI(api, responses);

      await api.deleteFiles(['content/posts/delete-post-1.md'], 'commitMessage');

      expect(api.request.mock.calls[1]).toEqual([
        '/repos/owner/repo/contents',
        {
          method: 'POST',
          body: JSON.stringify({
            branch: 'main',
            files: [
              {
                operation: 'delete',
                path: 'content/posts/delete-post-1.md',
                sha: 'old-sha-1',
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
      const api = new API({ branch: 'main', repo: 'owner/repo' });

      const tree = [
        { path: 'post.md', type: 'blob' },
        { path: 'dir1', type: 'tree' },
        { path: 'dir1/nested-post.md', type: 'blob' },
      ];
      api.request = vi.fn().mockResolvedValue({ tree });

      await expect(api.listFiles('posts', { depth: 1 })).resolves.toEqual([
        { path: 'posts/post.md', type: 'blob', name: 'post.md' },
      ]);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/main:posts', {
        params: {},
      });
    });
  });

  describe('editorial workflow', () => {
    it('createBranch creates a branch from the default branch', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });
      api.request = vi.fn().mockResolvedValue({ name: 'cms/posts/entry', commit: { id: 'sha' } });

      await api.createBranch('cms/posts/entry');

      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/branches', {
        method: 'POST',
        body: JSON.stringify({ new_branch_name: 'cms/posts/entry', old_ref_name: 'main' }),
      });
    });

    it('listUnpublishedBranches filters open PRs by CMS branch prefix and label', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo', originRepo: 'owner/repo' });
      api.getPullRequests = vi.fn().mockResolvedValue([
        {
          number: 1,
          state: 'open',
          head: { ref: 'cms/posts/entry-1', sha: 'sha1' },
          labels: [{ id: 1, name: 'decap-cms/draft' }],
        },
        {
          number: 2,
          state: 'open',
          head: { ref: 'some-other-branch', sha: 'sha2' },
          labels: [{ id: 1, name: 'decap-cms/draft' }],
        },
        {
          number: 3,
          state: 'open',
          head: { ref: 'cms/posts/entry-2', sha: 'sha3' },
          labels: [{ id: 2, name: 'not-a-cms-label' }],
        },
      ]);

      await expect(api.listUnpublishedBranches()).resolves.toEqual(['cms/posts/entry-1']);
    });

    it('getBranchPullRequest throws EditorialWorkflowError when no CMS-labeled PR exists', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });
      api.getPullRequests = vi.fn().mockResolvedValue([]);

      await expect(api.getBranchPullRequest('cms/posts/entry')).rejects.toThrow(
        'content is not under editorial workflow',
      );
    });

    it('setPullRequestStatus is a no-op for the mock (branch-only, not-yet-PR) pull request', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });
      api.getOrCreateLabel = vi.fn();
      api.updatePullRequestLabels = vi.fn();

      await api.setPullRequestStatus(
        { number: MOCK_PULL_REQUEST, state: 'open', labels: [], head: { ref: 'x', sha: 'y' } },
        'pending_review',
      );

      expect(api.getOrCreateLabel).not.toHaveBeenCalled();
      expect(api.updatePullRequestLabels).not.toHaveBeenCalled();
    });

    it('setPullRequestStatus replaces the CMS status label and keeps others', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo', cmsLabelPrefix: 'decap-cms/' });
      api.getOrCreateLabel = vi.fn().mockResolvedValue({ id: 9, name: 'decap-cms/pending_review' });
      api.updatePullRequestLabels = vi.fn().mockResolvedValue([]);

      await api.setPullRequestStatus(
        {
          number: 5,
          state: 'open',
          labels: [
            { id: 1, name: 'decap-cms/draft' },
            { id: 2, name: 'bug' },
          ],
          head: { ref: 'x', sha: 'y' },
        },
        'pending_review',
      );

      expect(api.getOrCreateLabel).toHaveBeenCalledWith('decap-cms/pending_review');
      expect(api.updatePullRequestLabels).toHaveBeenCalledWith(5, [2, 9]);
    });

    it('publishUnpublishedEntry merges the PR and deletes the branch', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });
      const pullRequest = { number: 7, state: 'open', labels: [], head: { ref: 'cms/posts/entry', sha: 'sha' } };
      api.getBranchPullRequest = vi.fn().mockResolvedValue(pullRequest);
      api.mergePR = vi.fn().mockResolvedValue(undefined);
      api.deleteBranch = vi.fn().mockResolvedValue(undefined);

      await api.publishUnpublishedEntry('posts', 'entry');

      expect(api.mergePR).toHaveBeenCalledWith(pullRequest);
      expect(api.deleteBranch).toHaveBeenCalledWith('cms/posts/entry');
    });

    it('editorialWorkflowGit creates the branch and opens a PR when the branch is new', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });
      api.getBranch = vi.fn().mockRejectedValue(new APIError('Not Found', 404, 'Forgejo'));
      api.createBranch = vi.fn().mockResolvedValue({ name: 'cms/posts/entry', commit: { id: 'sha' } });
      api.getChangeFileOperations = vi.fn().mockResolvedValue([]);
      api.changeFiles = vi.fn().mockResolvedValue({});
      api.createPR = vi.fn().mockResolvedValue({
        number: 1,
        state: 'open',
        labels: [],
        head: { ref: 'cms/posts/entry', sha: 'sha' },
      });
      api.setPullRequestStatus = vi.fn().mockResolvedValue(undefined);

      await api.editorialWorkflowGit(
        [{ slug: 'entry', path: 'content/posts/entry.md', raw: 'content' }],
        'entry',
        'posts',
        { commitMessage: 'Create entry', status: 'draft' },
      );

      expect(api.createBranch).toHaveBeenCalledWith('cms/posts/entry', 'main');
      expect(api.changeFiles).toHaveBeenCalledWith([], 'cms/posts/entry', {
        commitMessage: 'Create entry',
        status: 'draft',
      });
      expect(api.createPR).toHaveBeenCalledWith('Create entry', 'cms/posts/entry');
      expect(api.setPullRequestStatus).toHaveBeenCalledWith(
        { number: 1, state: 'open', labels: [], head: { ref: 'cms/posts/entry', sha: 'sha' } },
        'draft',
      );
    });

    it('editorialWorkflowGit persists to an existing branch without opening a new PR', async () => {
      const api = new API({ branch: 'main', repo: 'owner/repo' });
      api.getBranch = vi.fn().mockResolvedValue({ name: 'cms/posts/entry', commit: { id: 'sha' } });
      api.createBranch = vi.fn();
      api.getChangeFileOperations = vi.fn().mockResolvedValue([]);
      api.changeFiles = vi.fn().mockResolvedValue({});
      api.createPR = vi.fn();

      await api.editorialWorkflowGit(
        [{ slug: 'entry', path: 'content/posts/entry.md', raw: 'content' }],
        'entry',
        'posts',
        { commitMessage: 'Update entry' },
      );

      expect(api.createBranch).not.toHaveBeenCalled();
      expect(api.createPR).not.toHaveBeenCalled();
    });
  });

  // decaporg #7976
  describe('getPullRequests', () => {
    it('matches a pull request by ref when its head label has no owner', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' } as any);
      const pullRequest = { number: 1, head: { label: 'cms/new-branch', ref: 'cms/new-branch' } };
      api.requestAllPages = vi.fn().mockResolvedValue([pullRequest]);

      await expect(api.getPullRequests('open' as any, 'owner:cms/new-branch')).resolves.toEqual([pullRequest]);
    });

    it('does not match a branch-only label from a different branch', async () => {
      const api = new API({ branch: 'gh-pages', repo: 'owner/my-repo', token: 'token' } as any);
      api.requestAllPages = vi.fn().mockResolvedValue([
        { number: 2, head: { label: 'cms/other-branch', ref: 'cms/other-branch' } },
      ]);

      await expect(api.getPullRequests('open' as any, 'owner:cms/new-branch')).resolves.toEqual([]);
    });
  });
});
