jest.mock('netlify-cms-core/src/backend');
import { fromJS } from 'immutable';
import { oneLine, stripIndent } from 'common-tags';
import nock from 'nock';
import { Cursor } from 'netlify-cms-lib-util';
import Gitlab from '../implementation';
import AuthenticationPage from '../AuthenticationPage';

const { Backend, LocalStorageAuthStore } = jest.requireActual('netlify-cms-core/src/backend');

const generateEntries = (path, length) => {
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
};

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
    // TODO: folder_based_collection is an internal string, we should not
    // be depending on it here
    type: 'folder_based_collection',
  };
  const collectionManyEntriesConfig = {
    name: 'foo',
    folder: 'many-entries',
    fields: [{ name: 'title' }],
    // TODO: folder_based_collection is an internal string, we should not
    // be depending on it here
    type: 'folder_based_collection',
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
        config: fromJS(config),
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
      .get(expectedRepoUrl)
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
    const link = linkPage =>
      `<${url}?id=${expectedRepo}&page=${linkPage}&path=${path}&per_page=${perPage}&recursive=false>`;

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
    api
      .get(url)
      .query(true)
      .reply(200, mockRepo.files[path]);

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
      `"The GitLab backend needs a \\"repo\\" in the backend configuration."`,
    );
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
        `"Your GitLab user account does not have access to this repo."`,
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
  });

  describe('getEntry', () => {
    sharedSetup();

    it('returns an entry from folder collection', async () => {
      const entryTree = mockRepo.tree[collectionContentConfig.folder][0];
      const slug = entryTree.path
        .split('/')
        .pop()
        .replace('.md', '');

      interceptFiles(backend, entryTree.path);
      interceptCollection(backend, collectionContentConfig);

      const entry = await backend.getEntry(
        {
          config: fromJS({}),
          integrations: fromJS([]),
          entryDraft: fromJS({}),
          mediaLibrary: fromJS({}),
        },
        fromJS(collectionContentConfig),
        slug,
      );

      expect(entry).toEqual(expect.objectContaining({ path: entryTree.path }));
    });
  });

  describe('listEntries', () => {
    sharedSetup();

    it('returns entries from folder collection', async () => {
      const tree = mockRepo.tree[collectionContentConfig.folder];
      tree.forEach(file => interceptFiles(backend, file.path));

      interceptCollection(backend, collectionContentConfig);
      const entries = await backend.listEntries(fromJS(collectionContentConfig));

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
      const entries = await backend.listAllEntries(fromJS(collectionManyEntriesConfig));

      expect(entries).toEqual(
        expect.arrayContaining(tree.map(file => expect.objectContaining({ path: file.path }))),
      );
      expect(entries).toHaveLength(500);
    }, 7000);

    it('returns entries from file collection', async () => {
      const { files } = collectionFilesConfig;
      files.forEach(file => interceptFiles(backend, file.file));
      const entries = await backend.listEntries(fromJS(collectionFilesConfig));

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
      const entries = await backend.listEntries(fromJS(collectionManyEntriesConfig));

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
      const entries = await backend.listEntries(fromJS(collectionManyEntriesConfig));

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
