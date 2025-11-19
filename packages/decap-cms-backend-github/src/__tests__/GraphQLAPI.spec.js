import GraphQLAPI from '../GraphQLAPI';

global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));

describe('github GraphQL API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('editorialWorkflowGit', () => {
    it('should should flatten nested tree into a list of files', () => {
      const api = new GraphQLAPI({ branch: 'gh-pages', repo: 'owner/my-repo' });
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
          id: 'sha-1',
          type: 'blob',
          size: 1,
          path: 'posts/post-1.md',
        },
        {
          name: 'post-2.md',
          id: 'sha-2',
          type: 'blob',
          size: 2,
          path: 'posts/post-2.md',
        },
        {
          name: 'nested-post.md',
          id: 'nested-post-sha',
          type: 'blob',
          size: 3,
          path: 'posts/2019/nested-post.md',
        },
      ]);
    });
  });

  describe('pagination', () => {
    it('should return paginated results with correct metadata', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      // Mock the query method to return files
      const mockFiles = Array.from({ length: 50 }, (_, i) => ({
        name: `file-${i}.md`,
        sha: `sha-${i}`,
        type: 'blob',
        blob: { size: 100 },
      }));

      api.query = jest.fn().mockResolvedValue({
        data: {
          repository: {
            object: {
              entries: mockFiles,
            },
          },
        },
      });

      const result = await api.listFilesPaginated('posts', { pageSize: 20, page: 1 });

      expect(result.files.length).toBe(20);
      expect(result.totalCount).toBe(50);
      expect(result.pageCount).toBe(3);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(true);
    });

    it('should return last page correctly', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      const mockFiles = Array.from({ length: 50 }, (_, i) => ({
        name: `file-${i}.md`,
        sha: `sha-${i}`,
        type: 'blob',
        blob: { size: 100 },
      }));

      api.query = jest.fn().mockResolvedValue({
        data: {
          repository: {
            object: {
              entries: mockFiles,
            },
          },
        },
      });

      const result = await api.listFilesPaginated('posts', { pageSize: 20, page: 3 });

      expect(result.files.length).toBe(10);
      expect(result.page).toBe(3);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('caching', () => {
    it('should use CACHE_FIRST for immutable blob content', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo', token: 'test-token' });

      const mockQuery = jest.fn().mockResolvedValue({
        data: {
          repository: {
            object: {
              is_binary: false,
              text: 'file content',
            },
          },
        },
      });

      api.query = mockQuery;

      await api.retrieveBlobObject('owner', 'repo', 'test-sha', { fetchPolicy: 'cache-first' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchPolicy: 'cache-first',
        }),
      );
    });

    it('should invalidate cache for specific types', () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      // Mock cache structure
      api.client.cache.data = {
        delete: jest.fn(),
        data: {
          ROOT_QUERY: {
            'repository({"owner":"test"})': {},
            'pullRequest({"number":1})': {},
          },
        },
      };

      api.invalidateCache('PullRequest', '123');

      expect(api.client.cache.data.delete).toHaveBeenCalledWith('PullRequest:123');
    });
  });

  describe('recursive file loading', () => {
    it('should handle large directory trees with chunked loading', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      // Mock nested directory structure
      const mockRootEntries = Array.from({ length: 5 }, (_, i) => ({
        name: `dir-${i}`,
        sha: `dir-sha-${i}`,
        type: 'tree',
        tree: {
          entries: Array.from({ length: 10 }, (_, j) => ({
            name: `file-${i}-${j}.md`,
            sha: `sha-${i}-${j}`,
            type: 'blob',
            blob: { size: 100 },
          })),
        },
      }));

      let callCount = 0;
      api.query = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              repository: {
                object: {
                  entries: mockRootEntries,
                },
              },
            },
          });
        }
        return Promise.resolve({
          data: {
            repository: {
              object: {
                entries: [],
              },
            },
          },
        });
      });

      const result = await api.listFilesRecursive('posts', { maxDepth: 2, chunkSize: 10 });

      // Should process directories and find files
      expect(api.query).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Array);
    });

    it('should respect maxDepth parameter', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      api.query = jest.fn().mockResolvedValue({
        data: {
          repository: {
            object: {
              entries: [
                {
                  name: 'file.md',
                  sha: 'sha-1',
                  type: 'blob',
                  blob: { size: 100 },
                },
              ],
            },
          },
        },
      });

      await api.listFilesRecursive('posts', { maxDepth: 1 });

      // Should only query once for depth 1
      expect(api.query).toHaveBeenCalledTimes(1);
    });

    it('should automatically use listFilesRecursive for depth > 3 to avoid 502 errors', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      // Spy on listFilesRecursive to verify it's called
      const listFilesRecursiveSpy = jest.spyOn(api, 'listFilesRecursive');

      api.query = jest.fn().mockResolvedValue({
        data: {
          repository: {
            object: {
              entries: [
                {
                  name: 'file.md',
                  sha: 'sha-1',
                  type: 'blob',
                  blob: { size: 100 },
                },
              ],
            },
          },
        },
      });

      // Call listFiles with large depth (e.g., 100 which would cause 502)
      await api.listFiles('posts', { depth: 100 });

      // Should have delegated to listFilesRecursive
      expect(listFilesRecursiveSpy).toHaveBeenCalledWith('posts', {
        repoURL: api.repoURL,
        branch: 'main',
        maxDepth: 100,
      });

      listFilesRecursiveSpy.mockRestore();
    });
  });

  describe('batch metadata loading', () => {
    it('should batch fetch commit metadata for multiple files', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      const files = [
        { path: 'posts/post1.md', sha: 'sha1' },
        { path: 'posts/post2.md', sha: 'sha2' },
        { path: 'posts/post3.md', sha: 'sha3' },
      ];

      api.query = jest.fn().mockResolvedValue({
        data: {
          repository: {
            commits0: {
              target: {
                history: {
                  nodes: [
                    {
                      author: { name: 'John Doe', email: 'john@example.com', date: '2024-01-01' },
                      authoredDate: '2024-01-01T00:00:00Z',
                    },
                  ],
                },
              },
            },
            commits1: {
              target: {
                history: {
                  nodes: [
                    {
                      author: { name: 'Jane Smith', email: 'jane@example.com', date: '2024-01-02' },
                      authoredDate: '2024-01-02T00:00:00Z',
                    },
                  ],
                },
              },
            },
            commits2: {
              target: {
                history: {
                  nodes: [
                    {
                      author: { name: 'Bob Wilson', email: 'bob@example.com', date: '2024-01-03' },
                      authoredDate: '2024-01-03T00:00:00Z',
                    },
                  ],
                },
              },
            },
          },
        },
      });

      const results = await api.batchReadFileMetadata(files);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        author: 'John Doe',
        updatedOn: '2024-01-01T00:00:00Z',
      });
      expect(results[1]).toEqual({
        author: 'Jane Smith',
        updatedOn: '2024-01-02T00:00:00Z',
      });
      expect(results[2]).toEqual({
        author: 'Bob Wilson',
        updatedOn: '2024-01-03T00:00:00Z',
      });

      // Should make only one batched request for 3 files
      expect(api.query).toHaveBeenCalledTimes(1);
      expect(api.query).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchPolicy: 'cache-first',
        }),
      );
    });

    it('should batch requests in chunks for large file sets', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      // Create 50 files (should be split into 3 batches: 20, 20, 10)
      const files = Array.from({ length: 50 }, (_, i) => ({
        path: `posts/post${i}.md`,
        sha: `sha${i}`,
      }));

      api.query = jest.fn().mockImplementation(() => {
        const mockData = { repository: {} };
        // Generate mock data for each file in the batch
        for (let i = 0; i < 20; i++) {
          mockData.repository[`commits${i}`] = {
            target: {
              history: {
                nodes: [
                  {
                    author: { name: `Author ${i}`, email: `author${i}@example.com` },
                    authoredDate: `2024-01-${i + 1}T00:00:00Z`,
                  },
                ],
              },
            },
          };
        }
        return Promise.resolve({ data: mockData });
      });

      await api.batchReadFileMetadata(files);

      // Should make 3 requests (batches of 20, 20, 10)
      expect(api.query).toHaveBeenCalledTimes(3);
    });

    it('should handle missing commit data gracefully', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      const files = [
        { path: 'posts/post1.md', sha: 'sha1' },
        { path: 'posts/post2.md', sha: 'sha2' },
      ];

      api.query = jest.fn().mockResolvedValue({
        data: {
          repository: {
            commits0: {
              target: {
                history: {
                  nodes: [],
                },
              },
            },
            commits1: null, // Missing data
          },
        },
      });

      const results = await api.batchReadFileMetadata(files);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ author: '', updatedOn: '' });
      expect(results[1]).toEqual({ author: '', updatedOn: '' });
    });

    it('should handle batch query errors', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      const files = [
        { path: 'posts/post1.md', sha: 'sha1' },
        { path: 'posts/post2.md', sha: 'sha2' },
      ];

      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      api.query = jest.fn().mockRejectedValue(new Error('GraphQL error'));

      const results = await api.batchReadFileMetadata(files);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ author: '', updatedOn: '' });
      expect(results[1]).toEqual({ author: '', updatedOn: '' });
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });
  });

  describe('searchCode', () => {
    it('should search code via GitHub API', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      api.query = jest.fn().mockResolvedValue({
        data: {
          search: {
            codeCount: 42,
            edges: [
              { node: { path: 'content/post1.md', oid: 'sha1', name: 'post1.md' } },
              { node: { path: 'content/post2.md', oid: 'sha2', name: 'post2.md' } },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor123',
            },
          },
        },
      });

      const results = await api.searchCode('keyword', {
        path: 'content',
        extension: 'md',
      });

      expect(results.files).toHaveLength(2);
      expect(results.files[0]).toEqual({ path: 'content/post1.md', oid: 'sha1', name: 'post1.md' });
      expect(results.totalCount).toBe(42);
      expect(results.hasMore).toBe(true);

      expect(api.query).toHaveBeenCalledWith({
        query: expect.anything(),
        variables: {
          query: 'repo:owner/my-repo path:content extension:md keyword',
          first: 100,
        },
        fetchPolicy: 'no-cache',
      });
    });

    it('should build correct search query with multiple filters', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      api.query = jest.fn().mockResolvedValue({
        data: {
          search: {
            codeCount: 10,
            edges: [{ node: { path: 'src/index.js', oid: 'sha1', name: 'index.js' } }],
            pageInfo: { hasNextPage: false },
          },
        },
      });

      await api.searchCode('react', {
        path: 'src',
        extension: 'js',
        language: 'javascript',
        limit: 50,
      });

      expect(api.query).toHaveBeenCalledWith({
        query: expect.anything(),
        variables: {
          query: 'repo:owner/my-repo path:src extension:js language:javascript react',
          first: 50,
        },
        fetchPolicy: 'no-cache',
      });
    });

    it('should limit results to maximum of 100', async () => {
      const api = new GraphQLAPI({ branch: 'main', repo: 'owner/my-repo' });

      api.query = jest.fn().mockResolvedValue({
        data: {
          search: {
            codeCount: 500,
            edges: [],
            pageInfo: { hasNextPage: true },
          },
        },
      });

      await api.searchCode('test', { limit: 200 });

      expect(api.query).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            first: 100, // Should cap at 100, not use 200
          }),
        }),
      );
    });
  });
});
