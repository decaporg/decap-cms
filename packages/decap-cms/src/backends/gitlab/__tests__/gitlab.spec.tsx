/* eslint-disable import/order -- vi.mock must precede imports of the mocked module */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/backend');
import { oneLine, stripIndent } from '@/lib/util/index';
import { Cursor } from '@/lib/util/index';
import nock from 'nock';

import AuthenticationPage from '@/backends/gitlab/AuthenticationPage';
import Gitlab from '@/backends/gitlab/implementation';
import { noteIssueDescription } from '@/backends/gitlab/notesApi';
import { FOLDER } from '@/core/constants/collectionTypes';
import { registerEntryCodec } from '@/core/lib/registry';
import { jsonEntryCodec, jsonFrontmatterCodec } from '@/entry-codecs/json/index';
import { createMarkdownEntryCodec } from '@/entry-codecs/markdown/index';
import { tomlEntryCodec, tomlFrontmatterCodec } from '@/entry-codecs/toml/index';
import { yamlEntryCodec, yamlFrontmatterCodec } from '@/entry-codecs/yaml/index';
import { formatNoteBody } from '@/lib/backend/index';

import type * as BackendModule from '@/core/backend';

const { Backend, LocalStorageAuthStore } = await vi.importActual<typeof BackendModule>('../../../core/backend');

// Entry parsing goes through the (real) registry; register the built-in entry
// codecs the fat entries would provide at runtime.
registerEntryCodec(yamlEntryCodec);
registerEntryCodec(tomlEntryCodec);
registerEntryCodec(jsonEntryCodec);
registerEntryCodec(
  createMarkdownEntryCodec({
    frontmatter: [yamlFrontmatterCodec, tomlFrontmatterCodec, jsonFrontmatterCodec],
  }),
);

function generateEntries(path, length) {
  const entries = Array.from({ length }, (val, idx) => {
    const count = idx + 1;
    const id = `00${count}`.slice(-3);
    const fileName = `test${id}.md`;
    return { id, fileName, filePath: `${path}/${fileName}` };
  });

  return {
    tree: entries.map(({ id, fileName, filePath }) => ({
      id: `d8345753a1d935fa47a26317a503e73e1192d${id}`,
      name: fileName,
      type: 'blob',
      path: filePath,
      mode: '100644',
    })),
    files: entries.reduce(
      (acc, { id, filePath }) => ({
        ...acc,
        [filePath]: stripIndent`
        ---
        title: test ${id}
        ---
        # test ${id}
      `,
      }),
      {},
    ),
  };
}

const manyEntries = generateEntries('many-entries', 500);

const mockRepo = {
  tree: {
    '/': [
      {
        id: '5d0620ebdbc92068a3e866866e928cc373f18429',
        name: 'content',
        type: 'tree',
        path: 'content',
        mode: '040000',
      },
    ],
    content: [
      {
        id: 'b1a200e48be54fde12b636f9563d659d44c206a5',
        name: 'test1.md',
        type: 'blob',
        path: 'content/test1.md',
        mode: '100644',
      },
      {
        id: 'd8345753a1d935fa47a26317a503e73e1192d623',
        name: 'test2.md',
        type: 'blob',
        path: 'content/test2.md',
        mode: '100644',
      },
    ],
    'many-entries': manyEntries.tree,
  },
  files: {
    'content/test1.md': stripIndent`
      ---
      title: test
      ---
      # test
    `,
    'content/test2.md': stripIndent`
      ---
      title: test2
      ---
      # test 2
    `,
    ...manyEntries.files,
  },
};

const resp = {
  user: {
    success: {
      id: 1,
    },
  },
  branch: {
    success: {
      name: 'master',
      commit: {
        id: 1,
      },
    },
  },
  project: {
    success: {
      permissions: {
        project_access: {
          access_level: 30,
        },
      },
      default_branch: 'main',
    },
    readOnly: {
      permissions: {
        project_access: {
          access_level: 10,
        },
      },
    },
  },
};

describe('gitlab backend', () => {
  let authStore;
  let backend;
  const repo = 'foo/bar';
  const defaultConfig = {
    backend: {
      name: 'gitlab',
      repo,
    },
  };
  const collectionContentConfig = {
    name: 'foo',
    folder: 'content',
    fields: [{ name: 'title' }],
    type: FOLDER,
  };
  const collectionManyEntriesConfig = {
    name: 'foo',
    folder: 'many-entries',
    fields: [{ name: 'title' }],
    type: FOLDER,
  };
  const collectionFilesConfig = {
    name: 'foo',
    files: [
      {
        label: 'foo',
        name: 'foo',
        file: 'content/test1.md',
        fields: [{ name: 'title' }],
      },
      {
        label: 'bar',
        name: 'bar',
        file: 'content/test2.md',
        fields: [{ name: 'title' }],
      },
    ],
    type: 'file_based_collection',
  };
  const mockCredentials = { token: 'MOCK_TOKEN' };
  const expectedRepo = encodeURIComponent(repo);
  const expectedRepoUrl = `/projects/${expectedRepo}`;

  function resolveBackend(config = {}) {
    authStore = new LocalStorageAuthStore();
    return new Backend(
      {
        init: (...args) => new Gitlab(...args),
      },
      {
        backendName: 'gitlab',
        config,
        authStore,
      },
    );
  }

  function mockApi(backend) {
    return nock(backend.implementation.apiRoot);
  }

  function interceptAuth(backend, { userResponse, projectResponse } = {}) {
    const api = mockApi(backend);
    api
      .get('/user')
      .query(true)
      .reply(200, userResponse || resp.user.success);

    api
      // The `authenticate` method of the API class from netlify-cms-backend-gitlab
      // calls the same endpoint twice for gettng a single project.
      // First time through `this.api.hasWriteAccess()
      // Second time through the method `getDefaultBranchName` from lib-util
      // As a result, we need to repeat the same response twice.
      // Otherwise, we'll get an error: "No match for request to
      // https://gitlab.com/api/v4"

      .get(expectedRepoUrl)
      .times(2)
      .query(true)
      .reply(200, projectResponse || resp.project.success);
  }

  function interceptBranch(backend, { branch = 'master' } = {}) {
    const api = mockApi(backend);
    api
      .get(`${expectedRepoUrl}/repository/branches/${encodeURIComponent(branch)}`)
      .query(true)
      .reply(200, resp.branch.success);
  }

  function parseQuery(uri) {
    const query = uri.split('?')[1];
    if (!query) {
      return {};
    }
    return query.split('&').reduce((acc, q) => {
      const [key, value] = q.split('=');
      acc[key] = value;
      return acc;
    }, {});
  }

  function createHeaders(backend, { basePath, path, page, perPage, pageCount, totalCount }) {
    const pageNum = parseInt(page, 10);
    const pageCountNum = parseInt(pageCount, 10);
    const url = `${backend.implementation.apiRoot}${basePath}`;

    function link(linkPage) {
      return `<${url}?id=${expectedRepo}&page=${linkPage}&path=${path}&per_page=${perPage}&recursive=false>`;
    }

    const linkHeader = oneLine`
      ${link(1)}; rel="first",
      ${link(pageCount)}; rel="last",
      ${pageNum === 1 ? '' : `${link(pageNum - 1)}; rel="prev",`}
      ${pageNum === pageCountNum ? '' : `${link(pageNum + 1)}; rel="next",`}
    `.slice(0, -1);

    return {
      'X-Page': page,
      'X-Total-Pages': pageCount,
      'X-Per-Page': perPage,
      'X-Total': totalCount,
      Link: linkHeader,
    };
  }

  function interceptCollection(
    backend,
    collection,
    { verb = 'get', repeat = 1, page: expectedPage } = {},
  ) {
    const api = mockApi(backend);
    const url = `${expectedRepoUrl}/repository/tree`;
    const { folder } = collection;
    const tree = mockRepo.tree[folder];
    api[verb](url)
      .query(({ path, page }) => {
        if (path !== folder) {
          return false;
        }
        if (expectedPage && page && parseInt(page, 10) !== parseInt(expectedPage, 10)) {
          return false;
        }
        return true;
      })
      .times(repeat)
      .reply(uri => {
        const { page = 1, per_page = 20 } = parseQuery(uri);
        const pageCount = tree.length <= per_page ? 1 : Math.round(tree.length / per_page);
        const pageLastIndex = page * per_page;
        const pageFirstIndex = pageLastIndex - per_page;
        const resp = tree.slice(pageFirstIndex, pageLastIndex);
        return [
          200,
          verb === 'head' ? null : resp,
          createHeaders(backend, {
            basePath: url,
            path: folder,
            page,
            perPage: per_page,
            pageCount,
            totalCount: tree.length,
          }),
        ];
      });
  }

  function interceptFiles(backend, path) {
    const api = mockApi(backend);
    const url = `${expectedRepoUrl}/repository/files/${encodeURIComponent(path)}/raw`;
    api.get(url).query(true).reply(200, mockRepo.files[path]);

    api
      .get(`${expectedRepoUrl}/repository/commits`)
      .query(({ path }) => path === path)
      .reply(200, [
        {
          author_name: 'author_name',
          author_email: 'author_email',
          authored_date: 'authored_date',
        },
      ]);
  }

  function sharedSetup() {
    beforeEach(async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);
      interceptCollection(backend, collectionManyEntriesConfig, { verb: 'head' });
      interceptCollection(backend, collectionContentConfig, { verb: 'head' });
    });
  }

  it('throws if configuration does not include repo', () => {
    expect(() => resolveBackend({ backend: {} })).toThrowErrorMatchingInlineSnapshot(
      `[Error: The GitLab backend needs a "repo" in the backend configuration.]`,
    );
  });

  describe('use_graphql / graphql_api_root config', () => {
    it('defaults useGraphQL to false and graphQLAPIRoot to the GitLab public GraphQL endpoint', () => {
      backend = resolveBackend(defaultConfig);
      expect(backend.implementation.useGraphQL).toBe(false);
      expect(backend.implementation.graphQLAPIRoot).toBe('https://gitlab.com/api/graphql');
    });

    it('reads use_graphql and graphql_api_root from the backend config', () => {
      backend = resolveBackend({
        backend: {
          ...defaultConfig.backend,
          use_graphql: true,
          graphql_api_root: 'https://gitlab.example.com/api/graphql',
        },
      });
      expect(backend.implementation.useGraphQL).toBe(true);
      expect(backend.implementation.graphQLAPIRoot).toBe('https://gitlab.example.com/api/graphql');
    });
  });

  describe('authComponent', () => {
    it('returns authentication page component', () => {
      backend = resolveBackend(defaultConfig);
      expect(backend.authComponent()).toEqual(AuthenticationPage);
    });
  });

  describe('authenticate', () => {
    it('throws if user does not have access to project', async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend, { projectResponse: resp.project.readOnly });
      await expect(
        backend.authenticate(mockCredentials),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Your GitLab user account does not have access to this repo.]`,
      );
    });

    it('stores and returns user object on success', async () => {
      const backendName = defaultConfig.backend.name;
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      const user = await backend.authenticate(mockCredentials);
      expect(authStore.retrieve()).toEqual(user);
      expect(user).toEqual({ ...resp.user.success, ...mockCredentials, backendName });
    });

    // DCMS-1263: `getDefaultBranchName` (lib/util/API) throws on a failed
    // fetch instead of resolving to null/undefined. `authenticate` must not
    // let that rejection propagate -- it should fall back to the
    // constructor-default branch, same as the github/bitbucket backends.
    it('falls back to the constructor-default branch when the branch-resolve request fails', async () => {
      const backendName = defaultConfig.backend.name;
      backend = resolveBackend(defaultConfig);
      const api = mockApi(backend);
      api.get('/user').query(true).reply(200, resp.user.success);
      // First hit is `this.api.hasWriteAccess()`, second is `getDefaultBranchName`.
      api.get(expectedRepoUrl).query(true).reply(200, resp.project.success);
      api.get(expectedRepoUrl).query(true).reply(500);

      const user = await backend.authenticate(mockCredentials);

      expect(backend.implementation.branch).toBe('master');
      expect(user).toEqual({ ...resp.user.success, ...mockCredentials, backendName });
    });
  });

  describe('token refresh', () => {
    const pkceConfig = {
      backend: {
        name: 'gitlab',
        repo,
        auth_type: 'pkce',
        app_id: 'app-id',
      },
    };
    const pkceCredentials = { token: 'EXPIRED_TOKEN', refresh_token: 'REFRESH_TOKEN' };
    const expiredTokenResponse = {
      error: 'invalid_token',
      error_description: 'Token is expired. You can either do re-authorization or token refresh.',
    };
    // GitLab's REST API answers an invalid token with this instead of the
    // OAuth error shape (https://docs.gitlab.com/api/rest/authentication/).
    const unauthorizedTokenResponse = { message: '401 Unauthorized' };
    const restInvalidTokenResponses = [
      ['OAuth invalid_token', expiredTokenResponse],
      ['GitLab REST 401', unauthorizedTokenResponse],
    ] as const;

    it('stores the refresh token on login', async () => {
      backend = resolveBackend(pkceConfig);
      interceptAuth(backend);
      await backend.authenticate(pkceCredentials);
      expect(authStore.retrieve()).toEqual(expect.objectContaining(pkceCredentials));
    });

    it.each(restInvalidTokenResponses)(
      'refreshes the access token and retries the request on a %s response',
      async (_responseType, invalidTokenResponse) => {
        backend = resolveBackend(pkceConfig);
        interceptAuth(backend);
        await backend.authenticate(pkceCredentials);

        backend.implementation.authenticator = {
          refresh: vi
            .fn()
            .mockResolvedValue({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
        };

        const api = mockApi(backend);
        api
          .get('/user')
          .matchHeader('authorization', 'Bearer EXPIRED_TOKEN')
          .query(true)
          .reply(401, invalidTokenResponse);
        api
          .get('/user')
          .matchHeader('authorization', 'Bearer NEW_TOKEN')
          .query(true)
          .reply(200, resp.user.success);

        const user = await backend.implementation.api.user();

        expect(user).toEqual(resp.user.success);
        expect(backend.implementation.authenticator.refresh).toHaveBeenCalledWith({
          refresh_token: 'REFRESH_TOKEN',
        });
        expect(await backend.getToken()).toEqual('NEW_TOKEN');
        expect(authStore.retrieve()).toEqual(
          expect.objectContaining({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
        );
      },
    );

    it('refreshes the access token and retries a GraphQL request on 401', async () => {
      const { registerGitLabGraphQL } = await import('@/backends/gitlab/graphql');
      registerGitLabGraphQL();
      backend = resolveBackend({
        backend: {
          ...pkceConfig.backend,
          use_graphql: true,
        },
      });
      interceptAuth(backend);
      await backend.authenticate(pkceCredentials);

      backend.implementation.authenticator = {
        refresh: vi
          .fn()
          .mockResolvedValue({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
      };

      const graphQLApi = nock('https://gitlab.com');
      graphQLApi
        .post('/api/graphql')
        .matchHeader('authorization', 'Bearer EXPIRED_TOKEN')
        .reply(401, { errors: [{ message: 'Invalid token' }] });
      graphQLApi
        .post('/api/graphql')
        .matchHeader('authorization', 'Bearer NEW_TOKEN')
        .reply(200, {
          data: {
            project: {
              repository: {
                tree: {
                  blobs: {
                    nodes: [],
                    pageInfo: { endCursor: null, hasNextPage: false },
                  },
                },
              },
            },
          },
        });

      await expect(backend.implementation.api.listAllFiles('content', false)).resolves.toEqual([]);

      expect(backend.implementation.authenticator.refresh).toHaveBeenCalledWith({
        refresh_token: 'REFRESH_TOKEN',
      });
      expect(await backend.getToken()).toEqual('NEW_TOKEN');
      expect(graphQLApi.isDone()).toBe(true);
    });

    it('returns and persists the refreshed credentials when the token is refreshed during login', async () => {
      backend = resolveBackend(pkceConfig);

      // authenticate() drives its own instance internally, so stub the
      // authenticator ahead of time via the implementation constructor path.
      const api = mockApi(backend);
      api
        .get('/user')
        .matchHeader('authorization', 'Bearer EXPIRED_TOKEN')
        .query(true)
        .reply(401, unauthorizedTokenResponse);
      api
        .get('/user')
        .matchHeader('authorization', 'Bearer NEW_TOKEN')
        .query(true)
        .reply(200, resp.user.success);
      api.get(expectedRepoUrl).times(2).query(true).reply(200, resp.project.success);

      backend.implementation.authenticator = {
        refresh: vi
          .fn()
          .mockResolvedValue({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
      };

      const user = await backend.authenticate(pkceCredentials);

      expect(backend.implementation.authenticator.refresh).toHaveBeenCalledWith({
        refresh_token: 'REFRESH_TOKEN',
      });
      expect(user).toEqual(
        expect.objectContaining({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
      );
      expect(authStore.retrieve()).toEqual(
        expect.objectContaining({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
      );
    });

    it('does not try to refresh when not using pkce auth', async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);

      const api = mockApi(backend);
      api.get('/user').query(true).reply(401, expiredTokenResponse);

      await expect(backend.implementation.api.user()).rejects.toThrow(
        "Can't refresh access token when using implicit auth",
      );
    });
  });

  describe('currentUser', () => {
    it('returns null if no user', async () => {
      backend = resolveBackend(defaultConfig);
      const user = await backend.currentUser();
      expect(user).toEqual(null);
    });

    it('returns the stored user if exists', async () => {
      const backendName = defaultConfig.backend.name;
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);
      const user = await backend.currentUser();
      expect(user).toEqual({ ...resp.user.success, ...mockCredentials, backendName });
    });
  });

  describe('getToken', () => {
    it('returns the token for the current user', async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);
      const token = await backend.getToken();
      expect(token).toEqual(mockCredentials.token);
    });
  });

  describe('logout', () => {
    it('sets token to null', async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);
      await backend.logout();
      const token = await backend.getToken();
      expect(token).toEqual(null);
    });

    it('stops the notes polling manager', async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);

      const manager = backend.implementation.pollingManager;
      const destroy = vi.spyOn(manager, 'destroy');

      await backend.logout();

      expect(destroy).toHaveBeenCalledTimes(1);
      expect(backend.implementation.pollingManager).toBeUndefined();
      expect(backend.implementation.notesApi).toBeDefined();
    });
  });

  describe('notes polling manager', () => {
    it('is replaced, not leaked, when the user authenticates again', async () => {
      backend = resolveBackend(defaultConfig);
      interceptAuth(backend);
      await backend.authenticate(mockCredentials);

      const first = backend.implementation.pollingManager;
      const destroy = vi.spyOn(first, 'destroy');

      interceptAuth(backend);
      await backend.authenticate(mockCredentials);

      expect(destroy).toHaveBeenCalledTimes(1);
      expect(backend.implementation.pollingManager).not.toBe(first);

      backend.implementation.pollingManager.destroy();
    });
  });

  describe('notes', () => {
    const notesUser = { id: 1, username: 'ada', name: 'Ada Lovelace' };
    const issuesUrl = `${expectedRepoUrl}/issues`;
    const notesIssue = {
      iid: 12,
      title: 'Notes: My Post',
      description: noteIssueDescription('posts', 'my-post'),
      state: 'opened',
      updated_at: '2026-01-01T00:00:00Z',
      labels: ['decap-cms-notes', 'collection:posts'],
      web_url: 'https://gitlab.com/foo/bar/-/issues/12',
    };

    function noteComment(id, body, username = 'ada') {
      return {
        id,
        body,
        author: { username, avatar_url: `https://avatar/${username}` },
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };
    }

    function interceptUser(backend, user = notesUser) {
      mockApi(backend).get('/user').query(true).reply(200, user);
    }

    function interceptThread(backend, comments) {
      const api = mockApi(backend);
      api
        .get(issuesUrl)
        .query(query => query.search === 'posts/my-post' && query.labels === 'decap-cms-notes')
        .reply(200, [notesIssue]);
      api.get(`${issuesUrl}/12/notes`).query(true).reply(200, comments);
    }

    beforeEach(async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
      backend = resolveBackend({ ...defaultConfig, editor: { notes: true } });
      interceptAuth(backend, { userResponse: notesUser });
      await backend.authenticate(mockCredentials);
    });

    afterEach(() => {
      backend?.implementation.pollingManager?.destroy();
      vi.restoreAllMocks();
    });

    it('declares notes support to the core', () => {
      expect(backend.supportsNotes()).toBe(true);
      expect(backend.supportsNotesPolling()).toBe(true);
    });

    it("loads an entry's notes and marks the signed-in editor's own", async () => {
      interceptThread(backend, [
        noteComment(1, formatNoteBody({ content: 'mine', resolved: false })),
        noteComment(2, formatNoteBody({ content: 'theirs', resolved: true }), 'grace'),
      ]);
      interceptUser(backend);

      const notes = await backend.getNotes('posts', 'my-post');

      expect(notes).toEqual([
        expect.objectContaining({ id: '1', content: 'mine', author: 'ada', isOwn: true, entrySlug: 'my-post' }),
        expect.objectContaining({ id: '2', content: 'theirs', author: 'grace', isOwn: false, resolved: true }),
      ]);
      expect(notes[0].issueUrl).toBe(notesIssue.web_url);
    });

    it('still loads the notes when the editor cannot be identified', async () => {
      interceptThread(backend, [noteComment(1, 'a note')]);
      mockApi(backend).get('/user').query(true).reply(500, { message: 'boom' });

      const notes = await backend.getNotes('posts', 'my-post');

      expect(notes).toHaveLength(1);
      expect(notes[0].isOwn).toBeUndefined();
    });

    it('asks GitLab who the editor is once, and again after a failed lookup', async () => {
      mockApi(backend).get('/user').query(true).reply(500, { message: 'boom' });
      await expect(backend.implementation.noteAuthorIdentity()).rejects.toThrow();

      interceptUser(backend);
      expect(await backend.implementation.noteAuthorIdentity()).toEqual({ author: 'ada', authorId: undefined });
      // Served from the cached lookup: no interceptor is left for a third call.
      expect(await backend.implementation.noteAuthorIdentity()).toEqual({ author: 'ada', authorId: undefined });
    });

    it('opens the thread on the first note, named after the entry, as the signed-in editor', async () => {
      interceptUser(backend);
      const api = mockApi(backend);
      api.get(issuesUrl).query(true).reply(200, []);
      let createdIssue;
      api
        .post(issuesUrl, body => {
          createdIssue = body;
          return true;
        })
        .reply(201, notesIssue);
      let postedComment;
      api
        .post(`${issuesUrl}/12/notes`, body => {
          postedComment = body;
          return true;
        })
        .reply(201, noteComment(77, ''));

      const note = await backend.addNote(
        'posts',
        'my-post',
        { content: 'hello', author: 'someone else', timestamp: '', entrySlug: '', resolved: false },
        'My Post',
      );

      expect(createdIssue.title).toBe('Notes: My Post');
      expect(createdIssue.labels).toBe('decap-cms-notes,collection:posts');
      // The editor posts as themselves, so the marker records no author.
      expect(postedComment.body).toBe(formatNoteBody({ content: 'hello', resolved: false }));
      expect(note).toEqual(
        expect.objectContaining({
          id: '77',
          content: 'hello',
          author: 'ada',
          isOwn: true,
          entrySlug: 'my-post',
          resolved: false,
          issueUrl: notesIssue.web_url,
        }),
      );
      expect(note.authorId).toBeUndefined();
      expect(note.timestamp).not.toBe('');
    });

    it('rewrites the whole comment when only the resolved flag changes', async () => {
      interceptThread(backend, [noteComment(5, formatNoteBody({ content: 'keep me', resolved: false }))]);
      interceptUser(backend);
      let putBody;
      mockApi(backend)
        .put(`${issuesUrl}/12/notes/5`, body => {
          putBody = body;
          return true;
        })
        .reply(200, {});

      const updated = await backend.updateNote('posts', 'my-post', '5', { resolved: true });

      expect(putBody.body).toBe(formatNoteBody({ content: 'keep me', resolved: true }));
      expect(updated).toEqual(expect.objectContaining({ id: '5', content: 'keep me', resolved: true, isOwn: true }));
    });

    it('toggles resolution from the state the host reports', async () => {
      interceptThread(backend, [noteComment(5, formatNoteBody({ content: 'done', resolved: true }))]);
      interceptUser(backend);
      let putBody;
      mockApi(backend)
        .put(`${issuesUrl}/12/notes/5`, body => {
          putBody = body;
          return true;
        })
        .reply(200, {});

      const toggled = await backend.toggleNoteResolution('posts', 'my-post', '5');

      expect(putBody.body).toBe(formatNoteBody({ content: 'done', resolved: false }));
      expect(toggled.resolved).toBe(false);
    });

    it('refuses to update a note the thread does not have', async () => {
      interceptThread(backend, [noteComment(5, 'a note')]);

      await expect(backend.updateNote('posts', 'my-post', '6', { resolved: true })).rejects.toThrow(
        'Note with ID 6 not found',
      );
    });

    it('deletes a note through its thread', async () => {
      const api = mockApi(backend);
      api.get(issuesUrl).query(true).reply(200, [notesIssue]);
      const deleted = api.delete(`${issuesUrl}/12/notes/5`).reply(204);

      await backend.deleteNote('posts', 'my-post', '5');

      expect(deleted.isDone()).toBe(true);
    });

    it('refreshes an expired PKCE token for a notes request', async () => {
      backend = resolveBackend({ backend: { ...defaultConfig.backend, auth_type: 'pkce', app_id: 'app-id' } });
      interceptAuth(backend, { userResponse: notesUser });
      await backend.authenticate({ token: 'EXPIRED_TOKEN', refresh_token: 'REFRESH_TOKEN' });
      backend.implementation.authenticator = {
        refresh: vi.fn().mockResolvedValue({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
      };

      const api = mockApi(backend);
      api
        .get(issuesUrl)
        .matchHeader('authorization', 'Bearer EXPIRED_TOKEN')
        .query(true)
        .reply(401, { message: '401 Unauthorized' });
      api
        .get(issuesUrl)
        .matchHeader('authorization', 'Bearer NEW_TOKEN')
        .query(true)
        .reply(200, [notesIssue]);
      api.get(`${issuesUrl}/12/notes`).matchHeader('authorization', 'Bearer NEW_TOKEN').query(true).reply(200, []);
      interceptUser(backend);

      expect(await backend.getNotes('posts', 'my-post')).toEqual([]);
      expect(backend.implementation.authenticator.refresh).toHaveBeenCalledTimes(1);
    });

    it("closes the entry's thread when it is published", async () => {
      const implementation = backend.implementation;
      implementation.api.publishUnpublishedEntry = vi.fn().mockResolvedValue(undefined);
      const close = vi.spyOn(implementation.notesApi, 'closeIssueOnPublish').mockResolvedValue(undefined);

      await implementation.publishUnpublishedEntry('posts', 'my-post');

      expect(implementation.api.publishUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
      expect(close).toHaveBeenCalledWith('posts', 'my-post');
    });

    it('does not close the thread when publishing fails', async () => {
      const implementation = backend.implementation;
      implementation.api.publishUnpublishedEntry = vi.fn().mockRejectedValue(new Error('merge failed'));
      const close = vi.spyOn(implementation.notesApi, 'closeIssueOnPublish');

      await expect(implementation.publishUnpublishedEntry('posts', 'my-post')).rejects.toThrow('merge failed');
      expect(close).not.toHaveBeenCalled();
    });

    it("closes the entry's thread when the unpublished entry is deleted", async () => {
      const implementation = backend.implementation;
      implementation.api.deleteUnpublishedEntry = vi.fn().mockResolvedValue(undefined);
      const close = vi.spyOn(implementation.notesApi, 'closeEntryNotesIssue').mockResolvedValue(undefined);

      await implementation.deleteUnpublishedEntry('posts', 'my-post');

      expect(implementation.api.deleteUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
      expect(close).toHaveBeenCalledWith('posts', 'my-post');
    });

    it('reopens the thread of an entry moved back to the workflow', async () => {
      const implementation = backend.implementation;
      const reopen = vi.spyOn(implementation.notesApi, 'reopenIssueOnUnpublish').mockResolvedValue(undefined);

      await implementation.reopenIssueForUnpublishedEntry('posts', 'my-post');

      expect(reopen).toHaveBeenCalledWith('posts', 'my-post');
    });

    describe('on a site where no collection uses notes', () => {
      beforeEach(async () => {
        backend = resolveBackend(defaultConfig);
        interceptAuth(backend, { userResponse: notesUser });
        await backend.authenticate(mockCredentials);
      });

      it('publishes without looking the thread up', async () => {
        const implementation = backend.implementation;
        implementation.api.publishUnpublishedEntry = vi.fn().mockResolvedValue(undefined);
        const close = vi.spyOn(implementation.notesApi, 'closeIssueOnPublish');

        await implementation.publishUnpublishedEntry('posts', 'my-post');

        expect(implementation.api.publishUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(close).not.toHaveBeenCalled();
      });

      it('deletes without looking the thread up', async () => {
        const implementation = backend.implementation;
        implementation.api.deleteUnpublishedEntry = vi.fn().mockResolvedValue(undefined);
        const close = vi.spyOn(implementation.notesApi, 'closeEntryNotesIssue');

        await implementation.deleteUnpublishedEntry('posts', 'my-post');

        expect(implementation.api.deleteUnpublishedEntry).toHaveBeenCalledWith('posts', 'my-post');
        expect(close).not.toHaveBeenCalled();
      });

      it('does not reopen anything on unpublish', async () => {
        const implementation = backend.implementation;
        const reopen = vi.spyOn(implementation.notesApi, 'reopenIssueOnUnpublish');

        await implementation.reopenIssueForUnpublishedEntry('posts', 'my-post');

        expect(reopen).not.toHaveBeenCalled();
      });

      it('still closes the thread when a single file enables notes', async () => {
        backend = resolveBackend({
          ...defaultConfig,
          collections: [{ ...collectionFilesConfig, files: [{ ...collectionFilesConfig.files[0], editor: { notes: true } }] }],
        });
        interceptAuth(backend, { userResponse: notesUser });
        await backend.authenticate(mockCredentials);
        const implementation = backend.implementation;
        implementation.api.publishUnpublishedEntry = vi.fn().mockResolvedValue(undefined);
        const close = vi.spyOn(implementation.notesApi, 'closeIssueOnPublish').mockResolvedValue(undefined);

        await implementation.publishUnpublishedEntry('foo', 'foo');

        expect(close).toHaveBeenCalledWith('foo', 'foo');
      });
    });

    describe('polling', () => {
      it("watches the entry's thread and marks the editor's own notes in each update", async () => {
        const manager = backend.implementation.pollingManager;
        const unwatch = vi.fn();
        const watch = vi.spyOn(manager, 'watchIssueWithRetry').mockResolvedValue(unwatch);
        const onUpdate = vi.fn();

        await backend.startNotesPolling('posts', 'my-post', { onUpdate });

        expect(watch).toHaveBeenCalledWith('posts', 'my-post', expect.objectContaining({ onUpdate }), 5, 2000);
        const { prepareNotes } = watch.mock.calls[0][2];
        interceptUser(backend);
        const prepared = await prepareNotes([
          { id: '1', content: 'a', author: 'ada', timestamp: '', entrySlug: '', resolved: false },
          { id: '2', content: 'b', author: 'grace', timestamp: '', entrySlug: '', resolved: false },
        ]);
        expect(prepared.map(note => note.isOwn)).toEqual([true, false]);
      });

      it('does not restart a watch on the entry it is already watching', async () => {
        const manager = backend.implementation.pollingManager;
        const watch = vi.spyOn(manager, 'watchIssueWithRetry').mockResolvedValue(vi.fn());
        vi.spyOn(manager, 'getStatus').mockReturnValue({ ...manager.getStatus(), currentWatch: 'posts/my-post' });

        await backend.startNotesPolling('posts', 'my-post', {});

        expect(watch).not.toHaveBeenCalled();
      });

      it('does not throw when the thread cannot be watched', async () => {
        const manager = backend.implementation.pollingManager;
        vi.spyOn(manager, 'watchIssueWithRetry').mockRejectedValue(new Error('lookup failed'));

        await expect(backend.startNotesPolling('posts', 'my-post', {})).resolves.toBeUndefined();
      });

      it('stops watching the entry', async () => {
        const manager = backend.implementation.pollingManager;
        const unwatch = vi.fn();
        vi.spyOn(manager, 'watchIssueWithRetry').mockResolvedValue(unwatch);
        const stop = vi.spyOn(manager, 'stopWatching');

        await backend.startNotesPolling('posts', 'my-post', {});
        await backend.stopNotesPolling('posts', 'my-post');

        expect(unwatch).toHaveBeenCalledTimes(1);
        expect(stop).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('checks the thread on demand', async () => {
        const check = vi.spyOn(backend.implementation.pollingManager, 'checkIssueNow').mockResolvedValue(undefined);

        await backend.refreshNotesNow('posts', 'my-post');

        expect(check).toHaveBeenCalledWith('posts', 'my-post');
      });

      it('does nothing once logged out', async () => {
        await backend.implementation.logout();

        await expect(backend.startNotesPolling('posts', 'my-post', {})).resolves.toBeUndefined();
        await expect(backend.stopNotesPolling('posts', 'my-post')).resolves.toBeUndefined();
        await expect(backend.refreshNotesNow('posts', 'my-post')).resolves.toBeUndefined();
      });

      it('polls the thread end to end and reports a new note', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        try {
          const first = noteComment(1, 'first');
          const second = { ...noteComment(2, 'second', 'grace'), created_at: '2026-01-03T00:00:00Z' };
          const manager = backend.implementation.pollingManager;
          const api = mockApi(backend);
          api.get(issuesUrl).query(true).reply(200, [notesIssue]);
          // Read for the initial state, again for the immediate check, then
          // once more on the first interval tick, when a second note appears.
          api.get(`${issuesUrl}/12`).times(3).reply(200, notesIssue);
          let commentReads = 0;
          api
            .get(`${issuesUrl}/12/notes`)
            .query(true)
            .times(3)
            .reply(() => {
              commentReads += 1;
              return [200, commentReads <= 2 ? [first] : [first, second]];
            });
          interceptUser(backend);
          const onUpdate = vi.fn();

          await backend.startNotesPolling('posts', 'my-post', { onUpdate });
          await vi.waitFor(() => {
            expect(commentReads).toBe(2);
            expect(manager.isPolling).toBe(false);
          });
          expect(onUpdate).not.toHaveBeenCalled();

          await vi.advanceTimersByTimeAsync(15000);
          await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));

          const [notes, changes] = onUpdate.mock.calls[0];
          expect(notes.map(note => [note.content, note.isOwn])).toEqual([
            ['first', true],
            ['second', false],
          ]);
          expect(changes).toEqual([expect.objectContaining({ type: 'comment_added' })]);
        } finally {
          vi.useRealTimers();
        }
      });
    });
  });

  describe('getEntry', () => {
    sharedSetup();

    it('returns an entry from folder collection', async () => {
      const entryTree = mockRepo.tree[collectionContentConfig.folder][0];
      const slug = entryTree.path.split('/').pop().replace('.md', '');

      interceptFiles(backend, entryTree.path);
      interceptCollection(backend, collectionContentConfig);

      const entry = await backend.getEntry(
        {
          config: {},
          integrations: [],
          entryDraft: {},
          mediaLibrary: {},
        },
        collectionContentConfig,
        slug,
      );

      expect(entry).toEqual(expect.objectContaining({ path: entryTree.path }));
    });
  });

  describe('media files', () => {
    it('requests GitLab LFS content for media display files', async () => {
      backend = resolveBackend(defaultConfig);
      const blob = new Blob(['image content']);
      const readFile = vi.fn().mockResolvedValue(blob);
      backend.implementation.api = { readFile } as unknown as Gitlab['api'];
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/image');

      await expect(
        backend.implementation.getMediaDisplayURL({
          id: 'image-sha',
          path: 'static/uploads/image.png',
        }),
      ).resolves.toBe('blob:http://localhost/image');

      expect(readFile).toHaveBeenCalledWith('static/uploads/image.png', 'image-sha', {
        parseText: false,
        lfs: true,
      });
    });

    it('requests GitLab LFS content when downloading media files', async () => {
      backend = resolveBackend(defaultConfig);
      const blob = new Blob(['image content']);
      const readFile = vi.fn().mockResolvedValue(blob);
      backend.implementation.api = { readFile } as unknown as Gitlab['api'];
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/image');

      await expect(
        backend.implementation.getMediaFile('static/uploads/image.png'),
      ).resolves.toEqual(
        expect.objectContaining({
          displayURL: 'blob:http://localhost/image',
          path: 'static/uploads/image.png',
          name: 'image.png',
        }),
      );

      expect(readFile).toHaveBeenCalledWith('static/uploads/image.png', null, {
        parseText: false,
        lfs: true,
      });
    });

    it('requests GitLab LFS content when loading unpublished entry media files', async () => {
      backend = resolveBackend(defaultConfig);
      const blob = new Blob(['image content']);
      const readFile = vi.fn().mockResolvedValue(blob);
      backend.implementation.api = { readFile } as unknown as Gitlab['api'];
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/image');

      await expect(
        backend.implementation.loadMediaFile(
          'cms/posts/example',
          {
            path: 'static/uploads/image.png',
          } as Parameters<Gitlab['loadMediaFile']>[1],
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          displayURL: 'blob:http://localhost/image',
          path: 'static/uploads/image.png',
          name: 'image.png',
        }),
      );

      expect(readFile).toHaveBeenCalledWith('static/uploads/image.png', null, {
        branch: 'cms/posts/example',
        parseText: false,
        lfs: true,
      });
    });
  });

  describe('listEntries', () => {
    sharedSetup();

    it('returns entries from folder collection', async () => {
      const tree = mockRepo.tree[collectionContentConfig.folder];
      tree.forEach(file => interceptFiles(backend, file.path));

      interceptCollection(backend, collectionContentConfig);
      const entries = await backend.listEntries(collectionContentConfig);

      expect(entries).toEqual({
        cursor: expect.any(Cursor),
        pagination: 1,
        entries: expect.arrayContaining(
          tree.map(file => expect.objectContaining({ path: file.path })),
        ),
      });
      expect(entries.entries).toHaveLength(2);
    });

    it('returns all entries from folder collection', async () => {
      const tree = mockRepo.tree[collectionManyEntriesConfig.folder];
      interceptBranch(backend);
      tree.forEach(file => interceptFiles(backend, file.path));

      interceptCollection(backend, collectionManyEntriesConfig, { repeat: 5 });
      const entries = await backend.listAllEntries(collectionManyEntriesConfig);

      expect(entries).toEqual(
        expect.arrayContaining(tree.map(file => expect.objectContaining({ path: file.path }))),
      );
      expect(entries).toHaveLength(500);
    }, 7000);

    it('returns entries from file collection', async () => {
      const { files } = collectionFilesConfig;
      files.forEach(file => interceptFiles(backend, file.file));
      const entries = await backend.listEntries(collectionFilesConfig);

      expect(entries).toEqual({
        cursor: expect.any(Cursor),
        entries: expect.arrayContaining(
          files.map(file => expect.objectContaining({ path: file.file })),
        ),
      });
      expect(entries.entries).toHaveLength(2);
    });

    it('returns first page from paginated folder collection tree', async () => {
      const tree = mockRepo.tree[collectionManyEntriesConfig.folder];
      const pageTree = tree.slice(0, 20);
      pageTree.forEach(file => interceptFiles(backend, file.path));
      interceptCollection(backend, collectionManyEntriesConfig, { page: 1 });
      const entries = await backend.listEntries(collectionManyEntriesConfig);

      expect(entries.entries).toEqual(
        expect.arrayContaining(pageTree.map(file => expect.objectContaining({ path: file.path }))),
      );
      expect(entries.entries).toHaveLength(20);
    });
  });

  describe('traverseCursor', () => {
    sharedSetup();

    it('returns complete last page of paginated tree', async () => {
      const tree = mockRepo.tree[collectionManyEntriesConfig.folder];
      tree.slice(0, 20).forEach(file => interceptFiles(backend, file.path));
      interceptCollection(backend, collectionManyEntriesConfig, { page: 1 });
      const entries = await backend.listEntries(collectionManyEntriesConfig);

      const nextPageTree = tree.slice(20, 40);
      nextPageTree.forEach(file => interceptFiles(backend, file.path));
      interceptCollection(backend, collectionManyEntriesConfig, { page: 2 });
      const nextPage = await backend.traverseCursor(entries.cursor, 'next');

      expect(nextPage.entries).toEqual(
        expect.arrayContaining(
          nextPageTree.map(file => expect.objectContaining({ path: file.path })),
        ),
      );
      expect(nextPage.entries).toHaveLength(20);

      const lastPageTree = tree.slice(-20);
      lastPageTree.forEach(file => interceptFiles(backend, file.path));
      interceptCollection(backend, collectionManyEntriesConfig, { page: 25 });
      const lastPage = await backend.traverseCursor(nextPage.cursor, 'last');
      expect(lastPage.entries).toEqual(
        expect.arrayContaining(
          lastPageTree.map(file => expect.objectContaining({ path: file.path })),
        ),
      );
      expect(lastPage.entries).toHaveLength(20);
    });
  });

  describe('filterFile', () => {
    it('should return true for nested file with matching depth', () => {
      backend = resolveBackend(defaultConfig);

      expect(
        backend.implementation.filterFile(
          'content/posts',
          { name: 'index.md', path: 'content/posts/dir1/dir2/index.md' },
          'md',
          3,
        ),
      ).toBe(true);
    });

    it('should return false for nested file with non matching depth', () => {
      backend = resolveBackend(defaultConfig);

      expect(
        backend.implementation.filterFile(
          'content/posts',
          { name: 'index.md', path: 'content/posts/dir1/dir2/index.md' },
          'md',
          2,
        ),
      ).toBe(false);
    });
  });

  afterEach(() => {
    nock.cleanAll();
    authStore.logout();
    backend = null;
    expect(authStore.retrieve()).toEqual(null);
  });
});
