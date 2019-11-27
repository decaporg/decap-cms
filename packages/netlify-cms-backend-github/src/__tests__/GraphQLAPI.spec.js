import GraphQLAPI from '../GraphQLAPI';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('github GraphQL API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('editorialWorkflowGit', () => {
    it('should should flatten nested tree into a list of files', () => {
      const api = new GraphQLAPI({ branch: 'gh-pages', repo: 'my-repo' });
      const entries = [
        {
          name: 'post-1.md',
          sha: 'sha-1',
          type: 'blob',
          blob: { size: 1 },
        },
        {
          name: 'post-2.md',
          sha: 'sha-2',
          type: 'blob',
          blob: { size: 2 },
        },
        {
          name: '2019',
          sha: 'dir-sha',
          type: 'tree',
          object: {
            entries: [
              {
                name: 'nested-post.md',
                sha: 'nested-post-sha',
                type: 'blob',
                blob: { size: 3 },
              },
            ],
          },
        },
      ];
      const path = 'posts';

      expect(api.getAllFiles(entries, path)).toEqual([
        {
          name: 'post-1.md',
          sha: 'sha-1',
          type: 'blob',
          size: 1,
          path: 'posts/post-1.md',
          blob: { size: 1 },
        },
        {
          name: 'post-2.md',
          sha: 'sha-2',
          type: 'blob',
          size: 2,
          path: 'posts/post-2.md',
          blob: { size: 2 },
        },
        {
          name: 'nested-post.md',
          sha: 'nested-post-sha',
          type: 'blob',
          size: 3,
          path: 'posts/2019/nested-post.md',
          blob: { size: 3 },
        },
      ]);
    });
  });
});
