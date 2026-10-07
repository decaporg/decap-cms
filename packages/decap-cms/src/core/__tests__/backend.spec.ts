import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Backend,
  expandSearchEntries,
  extractSearchFields,
  getCollectionSearchFields,
  mergeExpandedEntries,
  resolveBackend,
  SERIALIZED_FILE_TYPE,
} from '@/core/backend';
import { FILES, FOLDER } from '@/core/constants/collectionTypes';
import {
  getBackend,
  getCustomFormatsExtensions,
  getCustomFormatsFormatters,
  getEntryCodec,
  getEntryCodecs,
} from '@/core/lib/registry';
import { sanitizeChar, sanitizeSlug } from '@/core/lib/urlHelper';
import { jsonEntryCodec, jsonFrontmatterCodec } from '@/entry-codecs/json/index';
import { createMarkdownEntryCodec } from '@/entry-codecs/markdown/index';
import { tomlEntryCodec, tomlFrontmatterCodec } from '@/entry-codecs/toml/index';
import { yamlEntryCodec, yamlFrontmatterCodec } from '@/entry-codecs/yaml/index';
import { asyncLock, localForage } from '@/lib/util/index';

vi.mock('../lib/registry');

// The registry is automocked; give the entry-format getters the state the fat
// entries produce at runtime (all three built-in packs registered). Re-invoke
// after `vi.resetAllMocks()`.
function mockEntryCodecRegistry() {
  const entryCodecs = [
    yamlEntryCodec,
    tomlEntryCodec,
    jsonEntryCodec,
    createMarkdownEntryCodec({ frontmatter: [yamlFrontmatterCodec, tomlFrontmatterCodec, jsonFrontmatterCodec] }),
  ];
  vi.mocked(getEntryCodecs).mockImplementation(() => entryCodecs);
  vi.mocked(getEntryCodec).mockImplementation(
    name => entryCodecs.find(pack => pack.name === name || pack.aliases?.includes(name)),
  );
  vi.mocked(getCustomFormatsExtensions).mockImplementation(() => ({}));
  vi.mocked(getCustomFormatsFormatters).mockImplementation(() => ({}));
}
mockEntryCodecRegistry();
vi.mock('../../lib/util/index', async () => ({
  fuzzyFilter: (await import('@/lib/util/core-utils/fuzzy')).fuzzyFilter,
  APIError: class APIError extends Error {
    status: number;
    api: string;
    constructor(message: string, status: number, api: string) {
      super(message);
      this.status = status;
      this.api = api;
      this.name = 'API_ERROR';
    }
  },
  AccessTokenError: class AccessTokenError extends Error {},
  ConfigurationError: class ConfigurationError extends Error {},
  CURSOR_COMPATIBILITY_SYMBOL: Symbol('cursor key for compatibility with old backends'),
  Cursor: class Cursor {
    static create = vi.fn(() => ({
      wrapData: vi.fn(function(this: unknown) {
        return this;
      }),
    }));
  },
  EditorialWorkflowError: class EditorialWorkflowError extends Error {
    notUnderEditorialWorkflow = false;
  },
  EDITORIAL_WORKFLOW_ERROR: 'EDITORIAL_WORKFLOW_ERROR',
  LocalSearchError: class LocalSearchError extends Error {
    errors: Error[];
    constructor(message: string, errors: Error[]) {
      super(message);
      this.errors = errors;
      this.name = 'LOCAL_SEARCH_ERROR';
    }
  },
  CmsSortDirection: {
    Ascending: 'Ascending',
    Descending: 'Descending',
    None: 'None',
  },
  localForage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    iterate: vi.fn(),
    key: vi.fn(),
    keys: vi.fn(),
    length: vi.fn(),
    config: vi.fn(),
    createInstance: vi.fn(),
    defineDriver: vi.fn(),
    driver: vi.fn(),
    dropInstance: vi.fn(),
    ready: vi.fn(),
    setDriver: vi.fn(),
  },
  isAbsolutePath: vi.fn((path: string) => path.startsWith('/')),
  basename: vi.fn((path: string, ext?: string) => {
    const base = path.split('/').pop() || '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  }),
  fileExtensionWithSeparator: vi.fn((path: string) => {
    const i = path.lastIndexOf('.');
    return i >= 0 ? path.slice(i) : '';
  }),
  fileExtension: vi.fn((path: string) => {
    const i = path.lastIndexOf('.');
    return i >= 0 ? path.slice(i + 1) : '';
  }),
  extname: vi.fn((path: string) => {
    const i = path.lastIndexOf('.');
    return i >= 0 ? path.slice(i) : '';
  }),
  dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/') || '.'),
  join: vi.fn((...parts: string[]) => parts.join('/').replace(/\/+/g, '/')),
  onlySuccessfulPromises: vi.fn(),
  flowAsync: vi.fn(),
  promiseThen: vi.fn(),
  unsentRequest: {
    fetchWithTimeout: vi.fn(),
    performRequest: vi.fn(),
    withRoot: vi.fn(),
    withHeaders: vi.fn(),
    withBody: vi.fn(),
    withMethod: vi.fn(),
    withJSON: vi.fn(),
    withNoCache: vi.fn(),
    toFetchArguments: vi.fn(),
  },
  filterByExtension: vi.fn(),
  getAllResponses: vi.fn(),
  parseLinkHeader: vi.fn(),
  parseResponse: vi.fn(),
  responseParser: vi.fn(),
  getPathDepth: vi.fn(),
  loadScript: vi.fn(),
  getBlobSHA: vi.fn(),
  asyncLock: vi.fn(() => ({ acquire: vi.fn(), release: vi.fn() })),
  entriesByFiles: vi.fn(),
  entriesByFolder: vi.fn(),
  unpublishedEntries: vi.fn(),
  getMediaDisplayURL: vi.fn(),
  getMediaAsBlob: vi.fn(),
  runWithLock: vi.fn(),
  blobToFileObj: vi.fn(),
  allEntriesByFolder: vi.fn(),
  readFile: vi.fn(),
  readFileMetadata: vi.fn(),
  isPreviewContext: vi.fn(),
  getPreviewStatus: vi.fn(),
  PreviewState: { Success: 'success', Other: 'other' },
  requestWithBackoff: vi.fn(),
  getDefaultBranchName: vi.fn(),
  throwOnConflictingBranches: vi.fn(),
  CMS_BRANCH_PREFIX: 'cms/',
  generateContentKey: vi.fn(),
  isCMSLabel: vi.fn(),
  labelToStatus: vi.fn(),
  statusToLabel: vi.fn(),
  DEFAULT_PR_BODY: '',
  MERGE_COMMIT_MESSAGE: '',
  parseContentKey: vi.fn(),
  branchFromContentKey: vi.fn(),
  contentKeyFromBranch: vi.fn(),
  createPointerFile: vi.fn(),
  getLargeMediaFilteredMediaFiles: vi.fn(),
  getLargeMediaPatternsFromGitAttributesFile: vi.fn(),
  parsePointerFile: vi.fn(),
  getPointerFileForMediaFileObj: vi.fn(),
  isHotkey: vi.fn(),
  isCodeHotkey: vi.fn(),
  isKeyHotkey: vi.fn(),
}));
vi.mock('../lib/urlHelper');

describe('Backend', () => {
  describe('filterEntries', () => {
    let backend;

    beforeEach(() => {
      getBackend.mockReturnValue({
        init: vi.fn(),
      });
      backend = resolveBackend({
        backend: {
          name: 'git-gateway',
        },
      });
    });

    it('filters string values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: 'testValue',
              },
            },
            {
              data: {
                testField: 'testValue2',
              },
            },
          ],
        },
        { field: 'testField', value: 'testValue' },
      );

      expect(result.length).toBe(1);
    });

    it('filters number values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: 42,
              },
            },
            {
              data: {
                testField: 5,
              },
            },
          ],
        },
        { field: 'testField', value: 42 },
      );

      expect(result.length).toBe(1);
    });

    it('filters boolean values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: false,
              },
            },
            {
              data: {
                testField: true,
              },
            },
          ],
        },
        { field: 'testField', value: false },
      );

      expect(result.length).toBe(1);
    });

    it('filters list values', () => {
      const result = backend.filterEntries(
        {
          entries: [
            {
              data: {
                testField: ['valueOne', 'valueTwo', 'testValue'],
              },
            },
            {
              data: {
                testField: ['valueThree'],
              },
            },
          ],
        },
        { field: 'testField', value: 'testValue' },
      );

      expect(result.length).toBe(1);
    });

    // Pinning test for DCMS-563: `filter` is undocumented, so pin the exact
    // matching semantics here in addition to the README's `collection.filter`
    // section (`src/core/README.md`) — strict equality for scalar fields, no
    // type coercion, `.includes()` membership for array fields.
    it('uses strict equality (no type coercion) for scalar fields', () => {
      const result = backend.filterEntries(
        {
          entries: [
            { data: { testField: 0 } },
            { data: { testField: '0' } },
            { data: { testField: false } },
          ],
        },
        { field: 'testField', value: 0 },
      );

      expect(result).toHaveLength(1);
      expect(result[0].data.testField).toBe(0);
    });

    it('uses .includes() membership for array fields regardless of order', () => {
      const result = backend.filterEntries(
        {
          entries: [
            { data: { testField: ['a', 'testValue', 'b'] } },
            { data: { testField: ['testValue'] } },
            { data: { testField: ['other'] } },
          ],
        },
        { field: 'testField', value: 'testValue' },
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('resolveBackend', () => {
    beforeEach(() => {
      (getBackend as ReturnType<typeof vi.fn>).mockReset();
    });

    it('throws when config.backend.name is unset', () => {
      expect(() => resolveBackend({ backend: {} })).toThrowError(
        'No backend defined in configuration',
      );
    });

    it('throws with the registerBackend hint for an unregistered backend', () => {
      (getBackend as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

      expect(() => resolveBackend({ backend: { name: 'some-unregistered-backend' } })).toThrowError(
        /Backend not found: some-unregistered-backend\..*Make sure the backend is registered with CMS\.registerBackend\(\) before/,
      );
    });
  });

  describe('getLocalDraftBackup', () => {
    (asyncLock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      acquire: vi.fn(),
      release: vi.fn(),
    }));

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return empty object on no item', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      const collection = {
        name: 'posts',
      };
      const slug = 'slug';

      localForage.getItem.mockReturnValue();

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({});
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    it('should return empty object on item with empty content', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };
      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      const collection = {
        name: 'posts',
      };
      const slug = 'slug';

      localForage.getItem.mockReturnValue({ raw: '' });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({});
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    it('should return backup entry, empty media files and assets when only raw property was saved', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      const collection = {
        name: 'posts',
      };
      const slug = 'slug';

      localForage.getItem.mockReturnValue({
        raw: '---\ntitle: "Hello World"\n---\n',
      });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({
        entry: {
          author: '',
          mediaFiles: [],
          collection: 'posts',
          slug: 'slug',
          path: '',
          projected: false,
          raw: '---\ntitle: "Hello World"\n---\n',
          data: { title: 'Hello World' },
          meta: {},
          i18n: {},
          label: null,
          isModification: null,
          status: '',
          updatedOn: '',
        },
      });
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    it('should return backup entry, media files and assets when all were backed up', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      const collection = {
        name: 'posts',
      };
      const slug = 'slug';

      localForage.getItem.mockReturnValue({
        raw: '---\ntitle: "Hello World"\n---\n',
        mediaFiles: [{ id: '1' }],
      });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({
        entry: {
          author: '',
          mediaFiles: [{ id: '1' }],
          collection: 'posts',
          slug: 'slug',
          path: '',
          projected: false,
          raw: '---\ntitle: "Hello World"\n---\n',
          data: { title: 'Hello World' },
          meta: {},
          i18n: {},
          label: null,
          isModification: null,
          status: '',
          updatedOn: '',
        },
      });
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    // Regression for DCMS-1427 / GH #1581: the `localStorage` + `JSON.stringify` backed
    // localForage shim (src/lib/util/localForage.ts) can't persist `File` bytes, so a
    // previously-written media `file` deserializes as a plain, non-Blob object (`{}`).
    // `getLocalDraftBackup` must not throw from `URL.createObjectURL` in that case.
    it('should not throw and should drop the file when a persisted media file deserialized as a non-Blob object', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      const collection = {
        name: 'posts',
      };
      const slug = 'slug';

      localForage.getItem.mockReturnValue({
        raw: '---\ntitle: "Hello World"\n---\n',
        // Simulates `JSON.parse(JSON.stringify(new File([...], 'nf-logo.png')))`,
        // which loses all of `File`'s properties since it has none of its own.
        mediaFiles: [{ id: '1', name: 'nf-logo.png', file: {} }],
      });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect((result as { entry: { mediaFiles: Array<{ file?: unknown }> } }).entry.mediaFiles).toEqual([
        { id: '1', name: 'nf-logo.png', file: undefined },
      ]);
    });

    it('should restore a real Blob/File from a properly serialized media file and call createObjectURL', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      const collection = {
        name: 'posts',
      };
      const slug = 'slug';

      const base64 = btoa('hello world');

      localForage.getItem.mockReturnValue({
        raw: '---\ntitle: "Hello World"\n---\n',
        mediaFiles: [
          {
            id: '1',
            name: 'nf-logo.png',
            file: {
              __type: SERIALIZED_FILE_TYPE,
              name: 'nf-logo.png',
              type: 'image/png',
              lastModified: 12345,
              base64,
            },
          },
        ],
      });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      const restoredFile = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as File;
      expect(restoredFile).toBeInstanceOf(File);
      expect(restoredFile.name).toBe('nf-logo.png');
      expect(restoredFile.type).toBe('image/png');
      await expect(restoredFile.text()).resolves.toBe('hello world');

      const mediaFiles = (result as { entry: { mediaFiles: Array<{ file?: unknown }> } }).entry.mediaFiles;
      expect(mediaFiles[0].file).toBeInstanceOf(File);
    });
  });

  describe('persistLocalDraftBackup', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should not persist empty entry', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      backend.entryToRaw = vi.fn().mockReturnValue('');

      const collection = {
        name: 'posts',
      };

      const slug = 'slug';

      const entry = {
        slug,
      };

      await backend.persistLocalDraftBackup(entry, collection);

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, entry);
      expect(localForage.setItem).toHaveBeenCalledTimes(0);
    });

    it('should persist non empty entry', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      backend.entryToRaw = vi.fn().mockReturnValue('content');

      const collection = {
        name: 'posts',
      };

      const slug = 'slug';

      const entry = {
        slug,
        path: 'content/posts/entry.md',
        mediaFiles: [{ id: '1' }],
      };

      await backend.persistLocalDraftBackup(entry, collection);

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, entry);
      expect(localForage.setItem).toHaveBeenCalledTimes(2);
      expect(localForage.setItem).toHaveBeenCalledWith('backup.posts.slug', {
        mediaFiles: [{ id: '1' }],
        path: 'content/posts/entry.md',
        raw: 'content',
      });
      expect(localForage.setItem).toHaveBeenCalledWith('backup', 'content');
    });
  });

  // DCMS-1884: local-draft backups are keyed by collection/slug, not by user, so
  // leaving them around after logout lets the next person who logs in on a shared
  // workstation get a "Restore backup" prompt hydrating the previous user's draft.
  describe('logout', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('purges every local-draft backup key after the implementation logs out', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
        logout: vi.fn().mockResolvedValue(undefined),
      };
      const authStore = { logout: vi.fn() };

      const backend = new Backend(implementation, { config: {}, backendName: 'github', authStore });
      // The constructor itself fires a `deleteAnonymousBackup()` cleanup call
      // (`localForage.removeItem('backup')`); reset so only `logout()`'s calls count.
      vi.clearAllMocks();

      localForage.keys.mockResolvedValue([
        'backup',
        'backup.posts',
        'backup.posts.slug-a',
        'backup.posts.slug-b',
        'gh.meta.some-cache-key',
      ]);

      await backend.logout();

      expect(implementation.logout).toHaveBeenCalledTimes(1);
      expect(authStore.logout).toHaveBeenCalledTimes(1);
      expect(localForage.removeItem).toHaveBeenCalledTimes(4);
      expect(localForage.removeItem).toHaveBeenCalledWith('backup');
      expect(localForage.removeItem).toHaveBeenCalledWith('backup.posts');
      expect(localForage.removeItem).toHaveBeenCalledWith('backup.posts.slug-a');
      expect(localForage.removeItem).toHaveBeenCalledWith('backup.posts.slug-b');
      expect(localForage.removeItem).not.toHaveBeenCalledWith('gh.meta.some-cache-key');
    });

    it('still purges local-draft backups when the implementation logout call fails', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
        logout: vi.fn().mockRejectedValue(new Error('network down')),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });
      vi.clearAllMocks();

      localForage.keys.mockResolvedValue(['backup.posts.slug']);

      await backend.logout();

      expect(localForage.removeItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    it('two-persona flow: a draft persisted by user A is unreachable after logout, so user B opening the same new-entry slot gets no restore-backup hydration', async () => {
      (asyncLock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        acquire: vi.fn(),
        release: vi.fn(),
      }));

      const implementation = {
        init: vi.fn(() => implementation),
        logout: vi.fn().mockResolvedValue(undefined),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });
      backend.entryToRaw = vi.fn().mockReturnValue('user A private draft content');
      vi.clearAllMocks();

      const collection = { name: 'posts' };
      const slug = 'new-entry-slug';
      const entryFromUserA = { slug, path: 'content/posts/entry.md', mediaFiles: [] };

      // User A types an unsaved draft; the entry editor autosaves it as a local backup.
      const store: Record<string, unknown> = {};
      localForage.setItem.mockImplementation((key: string, value: unknown) => {
        store[key] = value;
        return Promise.resolve(value);
      });
      await backend.persistLocalDraftBackup(entryFromUserA, collection);
      expect(store[`backup.${collection.name}.${slug}`]).toBeDefined();

      // User A logs out. The keys() call reflects everything still in the (fake) store.
      localForage.keys.mockResolvedValue(Object.keys(store));
      localForage.removeItem.mockImplementation((key: string) => {
        delete store[key];
        return Promise.resolve();
      });
      await backend.logout();

      // User B logs in and opens `.../collections/posts/new` for the same slug. The
      // entry editor asks the backend for a local draft backup before deciding whether
      // to show the "Restore backup" dialog.
      localForage.getItem.mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
      const result = await backend.getLocalDraftBackup(collection, slug);

      // No backup survives logout, so there is nothing to hydrate into user B's editor
      // and no "Restore backup" dialog is triggered.
      expect(result).toEqual({});
      expect(store[`backup.${collection.name}.${slug}`]).toBeUndefined();
    });
  });

  describe('persistEntry', () => {
    // decaporg #7451: collection size limit.
    describe('collection limit', () => {
      function setup({ limit, published = ['a', 'b'], unpublished = [] as string[], workflow = false }: {
        limit?: number,
        published?: string[],
        unpublished?: string[],
        workflow?: boolean,
      }) {
        const implementation = {
          init: vi.fn(() => implementation),
          persistEntry: vi.fn(),
          unpublishedEntries: vi.fn().mockResolvedValue(unpublished.map(slug => `id-${slug}`)),
          unpublishedEntry: vi.fn(({ id }: { id: string }) =>
            Promise.resolve({ collection: 'posts', slug: id.replace('id-', '') })
          ),
        };
        const config = {
          backend: { commit_messages: 'commit-messages' },
          ...(workflow && { publish_mode: 'editorial_workflow' }),
        };
        const collection = {
          name: 'posts',
          type: FOLDER,
          create: true,
          folder: 'posts',
          ...(limit !== undefined && { limit }),
        };
        const backend = new Backend(implementation as any, { config, backendName: 'github' } as any);
        backend.currentUser = vi.fn().mockResolvedValue({ login: 'login', name: 'name' });
        backend.entryToRaw = vi.fn().mockReturnValue('content');
        backend.invokePreSaveEvent = vi.fn().mockResolvedValue(undefined);
        backend.listAllEntries = vi.fn().mockResolvedValue(published.map(slug => ({ slug })));
        backend.generateUniqueSlug = vi.fn().mockResolvedValue('new-post');
        return { backend, implementation, config, collection };
      }

      const newDraft = { entry: { newRecord: true, data: { title: 'New post' } } };

      it('refuses a new entry once the limit is reached', async () => {
        const { backend, implementation, config, collection } = setup({ limit: 2 });

        await expect(
          backend.persistEntry({ config, collection, entryDraft: newDraft, assetProxies: [], usedSlugs: [] } as any),
        ).rejects.toThrow('Entry limit of 2 reached for collection posts');
        expect(implementation.persistEntry).not.toHaveBeenCalled();
      });

      it('saves a new entry below the limit', async () => {
        const { backend, implementation, config, collection } = setup({ limit: 3 });

        await backend.persistEntry(
          { config, collection, entryDraft: newDraft, assetProxies: [], usedSlugs: [] } as any,
        );
        expect(implementation.persistEntry).toHaveBeenCalledTimes(1);
      });

      it('counts unpublished entries with the editorial workflow', async () => {
        const { backend, implementation, config, collection } = setup({
          limit: 3,
          unpublished: ['b', 'c'],
          workflow: true,
        });

        await expect(
          backend.persistEntry({ config, collection, entryDraft: newDraft, assetProxies: [], usedSlugs: [] } as any),
        ).rejects.toThrow('Entry limit of 3 reached');
        expect(implementation.persistEntry).not.toHaveBeenCalled();
      });

      it('still saves changes to an existing entry at the limit', async () => {
        const { backend, implementation, config, collection } = setup({ limit: 2 });
        const existingDraft = { entry: { newRecord: false, slug: 'a', path: 'posts/a.md', data: { title: 'A' } } };

        await backend.persistEntry(
          { config, collection, entryDraft: existingDraft, assetProxies: [], usedSlugs: [] } as any,
        );
        expect(implementation.persistEntry).toHaveBeenCalledTimes(1);
      });

      it('ignores collections without a limit', async () => {
        const { backend, implementation, config, collection } = setup({ published: ['a', 'b', 'c', 'd'] });

        await backend.persistEntry(
          { config, collection, entryDraft: newDraft, assetProxies: [], usedSlugs: [] } as any,
        );
        expect(backend.listAllEntries).not.toHaveBeenCalled();
        expect(implementation.persistEntry).toHaveBeenCalledTimes(1);
      });
    });

    it('should update the draft with the new entry returned by preSave event', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
        persistEntry: vi.fn(() => implementation),
      };

      const config = {
        backend: {
          commit_messages: 'commit-messages',
        },
      };
      const collection = {
        name: 'posts',
      };
      const entry = {
        data: 'old_data',
      };
      const newEntry = {
        data: 'new_data',
      };
      const entryDraft = {
        entry,
      };
      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.currentUser = vi.fn().mockResolvedValue(user);
      backend.entryToRaw = vi.fn().mockReturnValue('content');
      backend.invokePreSaveEvent = vi.fn().mockReturnValueOnce(newEntry);

      await backend.persistEntry({ config, collection, entryDraft });

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, newEntry);
    });

    it('should update the draft with the new data returned by preSave event', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
        persistEntry: vi.fn(() => implementation),
      };

      const config = {
        backend: {
          commit_messages: 'commit-messages',
        },
      };
      const collection = {
        name: 'posts',
      };
      const entry = {
        data: {},
      };
      const newData = {};
      const newEntry = {
        data: newData,
      };
      const entryDraft = {
        entry,
      };
      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.currentUser = vi.fn().mockResolvedValue(user);
      backend.entryToRaw = vi.fn().mockReturnValue('content');
      backend.invokePreSaveEvent = vi.fn().mockReturnValueOnce(newData);

      await backend.persistEntry({ config, collection, entryDraft });

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, newEntry);
    });

    it('should preserve slug when preSave event handler modifies file collection entry', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
        persistEntry: vi.fn(() => implementation),
      };

      const config = {
        backend: {
          commit_messages: 'commit-messages',
        },
      };

      const collection = {
        name: 'settings',
        type: FILES,
        files: [
          {
            name: 'config',
            file: 'data/config.json',
            fields: [{ name: 'title', widget: 'string' }],
          },
        ],
      };

      const originalEntry = {
        slug: 'config',
        path: 'data/config.json',
        data: { title: 'original' },
        meta: { path: 'data/config.json' },
      };

      const entryDraft = {
        entry: originalEntry,
      };

      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.currentUser = vi.fn().mockResolvedValue(user);
      backend.entryToRaw = vi.fn().mockReturnValue('content');

      // Returning the FULL entry with slug — not just the data — is the
      // contract verified by registry.invokeEvent.
      backend.invokePreSaveEvent = vi.fn().mockImplementation(async entry => {
        return { ...entry, data: { ...entry.data, title: 'modified' } };
      });

      await backend.persistEntry({ config, collection, entryDraft });

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      const entryPassedToRaw = backend.entryToRaw.mock.calls[0][1];

      expect(entryPassedToRaw.slug).toBe('config');
      expect(entryPassedToRaw.path).toBe('data/config.json');
      expect(entryPassedToRaw.data.title).toBe('modified');
    });
  });

  describe('deleteEntry', () => {
    function setup(entry: Record<string, unknown> | undefined) {
      const implementation = { init: vi.fn(() => implementation), deleteFiles: vi.fn().mockResolvedValue(undefined) };
      const config = { backend: { commit_messages: 'commit-messages' } };
      const collection = {
        name: 'posts',
        type: FOLDER,
        folder: 'content/posts',
        extension: 'md',
        delete: true,
        i18n: { structure: 'multiple_files', locales: ['en', 'de', 'si'], default_locale: 'en' },
      };
      const backend = new Backend(implementation as any, { config, backendName: 'gitlab' } as any);
      backend.currentUser = vi.fn().mockResolvedValue({ login: 'login', name: 'name' });
      backend.invokePreUnpublishEvent = vi.fn().mockResolvedValue(undefined);
      backend.invokePostUnpublishEvent = vi.fn().mockResolvedValue(undefined);
      const state = { config, entries: { entities: entry ? { 'posts.test': entry } : {} } };
      return { backend, implementation, state, collection };
    }

    it('deletes only the locale files an i18n entry has', async () => {
      // GitLab rejects a commit that deletes a file which does not exist, so a
      // locale nobody filled in must not be named.
      const { backend, implementation, state, collection } = setup({ slug: 'test', i18n: {} });

      await backend.deleteEntry(state as any, collection as any, 'test');

      expect(implementation.deleteFiles).toHaveBeenCalledWith(['content/posts/test.en.md'], expect.any(String));
    });

    it('deletes every locale file the entry has data for', async () => {
      const { backend, implementation, state, collection } = setup({ slug: 'test', i18n: { de: { data: {} } } });

      await backend.deleteEntry(state as any, collection as any, 'test');

      expect(implementation.deleteFiles).toHaveBeenCalledWith(
        ['content/posts/test.en.md', 'content/posts/test.de.md'],
        expect.any(String),
      );
    });
  });

  describe('persistMedia', () => {
    it('should persist media', async () => {
      const persistMediaResult = {};
      const implementation = {
        init: vi.fn(() => implementation),
        persistMedia: vi.fn().mockResolvedValue(persistMediaResult),
      };
      const config = { backend: { name: 'github' } };

      const backend = new Backend(implementation, { config, backendName: config.backend.name });
      const user = { login: 'login', name: 'name' };
      backend.currentUser = vi.fn().mockResolvedValue(user);

      const file = { path: 'static/media/image.png' };

      const result = await backend.persistMedia(config, file);
      expect(result).toBe(persistMediaResult);
      expect(implementation.persistMedia).toHaveBeenCalledTimes(1);
      expect(implementation.persistMedia).toHaveBeenCalledWith(
        { path: 'static/media/image.png' },
        { commitMessage: 'Upload "static/media/image.png"' },
      );
    });
  });

  describe('unpublishedEntry', () => {
    it('should return unpublished entry', async () => {
      const unpublishedEntryResult = {
        diffs: [{ path: 'src/posts/index.md', newFile: false }, { path: 'netlify.png' }],
      };
      const implementation = {
        init: vi.fn(() => implementation),
        unpublishedEntry: vi.fn().mockResolvedValue(unpublishedEntryResult),
        unpublishedEntryDataFile: vi.fn().mockResolvedValueOnce('---\ntitle: "Hello World"\n---\n'),
        unpublishedEntryMediaFile: vi.fn().mockResolvedValueOnce({ id: '1' }),
      };
      const config = {
        media_folder: 'static/images',
      };

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = {
        name: 'posts',
        folder: 'src/posts',
        fields: [],
      };

      const state = {
        config,
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {},
      };

      const slug = 'slug';

      const result = await backend.unpublishedEntry(state, collection, slug);
      expect(result).toEqual({
        author: '',
        collection: 'posts',
        slug: '',
        path: 'src/posts/index.md',
        projected: false,
        raw: '---\ntitle: "Hello World"\n---\n',
        data: { title: 'Hello World' },
        meta: { path: 'src/posts/index.md' },
        i18n: {},
        label: null,
        isModification: true,
        mediaFiles: [{ id: '1', draft: true }],
        status: '',
        updatedOn: '',
      });
    });
  });

  describe('generateUniqueSlug', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      mockEntryCodecRegistry();
    });

    it("should return unique slug when entry doesn't exist", async () => {
      (sanitizeSlug as ReturnType<typeof vi.fn>).mockReturnValue('some-post-title');

      const implementation = {
        init: vi.fn(() => implementation),
        getEntry: vi.fn(() => Promise.resolve()),
      };

      const collection = {
        name: 'posts',
        fields: [
          {
            name: 'title',
          },
        ],
        type: FOLDER,
        folder: 'posts',
        slug: '{{slug}}',
        path: 'sub_dir/{{slug}}',
      };

      const entry = {
        title: 'some post title',
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      await expect(backend.generateUniqueSlug(collection, entry, {}, [])).resolves.toBe(
        'sub_dir/some-post-title',
      );
    });

    it('should return unique slug when entry exists', async () => {
      (sanitizeSlug as ReturnType<typeof vi.fn>).mockReturnValue('some-post-title');
      (sanitizeChar as ReturnType<typeof vi.fn>).mockReturnValue('-');

      const implementation = {
        init: vi.fn(() => implementation),
        getEntry: vi.fn(),
      };

      implementation.getEntry.mockResolvedValueOnce({
        file: { path: 'sub_dir/some-post-title' },
        content: { kind: 'raw', raw: 'data' },
      });
      implementation.getEntry.mockResolvedValueOnce();

      const collection = {
        name: 'posts',
        fields: [
          {
            name: 'title',
          },
        ],
        type: FOLDER,
        folder: 'posts',
        slug: '{{slug}}',
        path: 'sub_dir/{{slug}}',
      };

      const entry = {
        title: 'some post title',
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      await expect(backend.generateUniqueSlug(collection, entry, {}, [])).resolves.toBe(
        'sub_dir/some-post-title-1',
      );
    });
  });

  // decaporg #7612: a collection filter must see an i18n entry after its
  // locales are grouped.
  describe('processEntries', () => {
    let backend: Backend;

    function createCollection(i18n?: Record<string, unknown>) {
      return {
        name: 'posts',
        type: FOLDER,
        folder: '_posts',
        format: 'yaml',
        extension: 'yml',
        filter: { field: 'draft', value: false },
        fields: [{ name: 'title' }, { name: 'draft' }],
        ...(i18n && { i18n }),
      } as any;
    }

    function loadedEntry(path: string, raw: string) {
      return { file: { path }, content: { kind: 'raw' as const, raw } };
    }

    beforeEach(() => {
      (getBackend as ReturnType<typeof vi.fn>).mockReturnValue({ init: vi.fn() });
      mockEntryCodecRegistry();
      backend = resolveBackend({ backend: { name: 'git-gateway' } } as any);
    });

    it('filters entries of a single file i18n collection on the default locale data', () => {
      const collection = createCollection({
        structure: 'single_file',
        locales: ['en', 'de'],
        default_locale: 'en',
      });

      const result = backend.processEntries(
        [
          loadedEntry(
            '_posts/published.yml',
            'en:\n  title: Published\n  draft: false\nde:\n  title: Veröffentlicht\n  draft: false\n',
          ),
          loadedEntry(
            '_posts/drafted.yml',
            'en:\n  title: Drafted\n  draft: true\nde:\n  title: Entwurf\n  draft: true\n',
          ),
        ] as any,
        collection,
      );

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('published');
      expect(result[0].data).toEqual({ title: 'Published', draft: false });
      expect(result[0].i18n).toEqual({ de: { data: { title: 'Veröffentlicht', draft: false } } });
    });

    it('keeps translations of a multiple files i18n collection whose filter field is not translated', () => {
      const collection = createCollection({
        structure: 'multiple_files',
        locales: ['en', 'de'],
        default_locale: 'en',
      });

      const result = backend.processEntries(
        [
          loadedEntry('_posts/published.en.yml', 'title: Published\ndraft: false\n'),
          loadedEntry('_posts/published.de.yml', 'title: Veröffentlicht\n'),
          loadedEntry('_posts/drafted.en.yml', 'title: Drafted\ndraft: true\n'),
          loadedEntry('_posts/drafted.de.yml', 'title: Entwurf\n'),
        ] as any,
        collection,
      );

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('published');
      expect(result[0].data).toEqual({ title: 'Published', draft: false });
      expect(result[0].i18n).toEqual({ de: { data: { title: 'Veröffentlicht' } } });
    });

    it('filters entries of a collection without i18n', () => {
      const result = backend.processEntries(
        [
          loadedEntry('_posts/published.yml', 'title: Published\ndraft: false\n'),
          loadedEntry('_posts/drafted.yml', 'title: Drafted\ndraft: true\n'),
        ] as any,
        createCollection(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('published');
      expect(result[0].data).toEqual({ title: 'Published', draft: false });
    });
  });

  // DCMS-1354 / DCMS-1352: port of DCMS-514 (#560) to v4.beta. An unknown slug in
  // a files collection used to reach `implementation.getEntry` with an `undefined`
  // path (silently cast `as string`), crashing deep in path parsing with a raw
  // TypeError instead of a clean not-found error.
  describe('getEntry', () => {
    it('throws a clean not-found error for an unknown files-collection slug', async () => {
      const implementation = {
        init: vi.fn(() => implementation),
        getEntry: vi.fn(),
      };

      const collection = {
        name: 'settings',
        type: FILES,
        files: [
          {
            name: 'general',
            file: 'data/general.json',
            fields: [{ name: 'title' }],
          },
        ],
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      await expect(backend.getEntry({}, collection, 'unknown-slug')).rejects.toThrow(
        'Entry not found: settings/unknown-slug',
      );
      expect(implementation.getEntry).not.toHaveBeenCalled();
    });
  });

  describe('extractSearchFields', () => {
    it('should extract slug', () => {
      expect(extractSearchFields(['slug'])({ slug: 'entry-slug', data: {} })).toEqual(
        ' entry-slug',
      );
    });

    it('should extract path', () => {
      expect(extractSearchFields(['path'])({ path: 'entry-path', data: {} })).toEqual(
        ' entry-path',
      );
    });

    it('should extract fields', () => {
      expect(
        extractSearchFields(['title', 'order'])({ data: { title: 'Entry Title', order: 5 } }),
      ).toEqual(' Entry Title 5');
    });

    it('should extract nested fields', () => {
      expect(
        extractSearchFields(['nested.title'])({ data: { nested: { title: 'nested title' } } }),
      ).toEqual(' nested title');
    });
  });

  describe('getCollectionSearchFields', () => {
    it('uses explicitly configured search fields', () => {
      const collection = {
        name: 'posts',
        folder: 'posts',
        search_fields: ['description', 'nested.title'],
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'description', widget: 'text' },
        ],
      };

      expect(getCollectionSearchFields(collection)).toEqual(['description', 'nested.title']);
    });

    it('should derive search fields from inferred title/shortTitle/author fields', () => {
      const collection = {
        name: 'posts',
        folder: 'posts',
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'short_title', widget: 'string' },
          { name: 'author', widget: 'string' },
        ],
      };

      expect(getCollectionSearchFields(collection)).toEqual(['title', 'short_title', 'author']);
    });

    it('should include summary template fields', () => {
      const collection = {
        name: 'posts',
        folder: 'posts',
        summary: '{{description}}',
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'description', widget: 'string' },
        ],
      };

      expect(getCollectionSearchFields(collection)).toEqual(['title', 'description']);
    });

    it('should derive search fields from top level file fields for file collections', () => {
      const collection = {
        name: 'files',
        type: FILES,
        files: [
          { name: 'file1', fields: [{ name: 'author', widget: 'string' }] },
          { name: 'file2', fields: [{ name: 'other', widget: 'string' }] },
        ],
      };

      expect(getCollectionSearchFields(collection)).toEqual(['author', 'other']);
    });

    it('should de-duplicate and drop falsy fields', () => {
      const collection = {
        name: 'posts',
        folder: 'posts',
        summary: '{{title}}',
        fields: [{ name: 'title', widget: 'string' }],
      };

      expect(getCollectionSearchFields(collection)).toEqual(['title']);
    });
  });

  describe('search/query', () => {
    const collections = [
      {
        name: 'posts',
        folder: 'posts',
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'short_title', widget: 'string' },
          { name: 'author', widget: 'string' },
          { name: 'description', widget: 'string' },
          { name: 'nested', widget: 'object', fields: { name: 'title', widget: 'string' } },
        ],
      },
      {
        name: 'pages',
        folder: 'pages',
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'short_title', widget: 'string' },
          { name: 'author', widget: 'string' },
          { name: 'description', widget: 'string' },
          { name: 'nested', widget: 'object', fields: { name: 'title', widget: 'string' } },
        ],
      },
    ];

    const posts = [
      {
        path: 'posts/find-me.md',
        slug: 'find-me',
        data: {
          title: 'find me by title',
          short_title: 'find me by short title',
          author: 'find me by author',
          description: 'find me by description',
          nested: { title: 'find me by nested title' },
        },
      },
      { path: 'posts/not-me.md', slug: 'not-me', data: { title: 'not me' } },
    ];

    const pages = [
      {
        path: 'pages/find-me.md',
        slug: 'find-me',
        data: {
          title: 'find me by title',
          short_title: 'find me by short title',
          author: 'find me by author',
          description: 'find me by description',
          nested: { title: 'find me by nested title' },
        },
      },
      { path: 'pages/not-me.md', slug: 'not-me', data: { title: 'not me' } },
    ];

    const files = [
      {
        path: 'files/file1.md',
        slug: 'file1',
        data: {
          author: 'find me by author',
        },
      },
      {
        path: 'files/file2.md',
        slug: 'file2',
        data: {
          other: 'find me by other',
        },
      },
    ];

    const implementation = {
      init: vi.fn(() => implementation),
    };

    let backend;
    beforeEach(() => {
      backend = new Backend(implementation, { config: {}, backendName: 'github' });
      backend.listAllEntries = vi.fn(collection => {
        if (collection.name === 'posts') {
          return Promise.resolve(posts);
        }
        if (collection.name === 'pages') {
          return Promise.resolve(pages);
        }
        if (collection.name === 'files') {
          return Promise.resolve(files);
        }
        return Promise.resolve([]);
      });
    });

    it('should search collections by title', async () => {
      const results = await backend.search(collections, 'find me by title');

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should search collections by short title', async () => {
      const results = await backend.search(collections, 'find me by short title');

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should search collections by author', async () => {
      const results = await backend.search(collections, 'find me by author');

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should constrain a search to an explicitly named field', async () => {
      const results = await backend.search(collections, 'author:"find me by author"');

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should combine field clauses with ordinary fuzzy terms', async () => {
      const results = await backend.search(collections, 'author:author short');

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should not drop a clause match because of a short free-text term (DCMS-1540)', async () => {
      const clauseOnly = await backend.search(collections, 'title:find');
      const clauseAndShortTerm = await backend.search(collections, 'title:find by');

      expect(clauseAndShortTerm).toEqual({
        entries: [posts[0], pages[0]],
      });
      // combining a clause with free text must never return more matches
      // than the clause alone would - only narrow it further.
      expect(clauseAndShortTerm.entries.length).toBeLessThanOrEqual(clauseOnly.entries.length);
    });

    it('should return a subset of the clause-only result for a 1-character free-text term', async () => {
      const clauseOnly = await backend.search(collections, 'title:find');
      const clauseAndOneChar = await backend.search(collections, 'title:find m');

      expect(clauseAndOneChar.entries.length).toBeGreaterThan(0);
      expect(clauseAndOneChar.entries.length).toBeLessThanOrEqual(clauseOnly.entries.length);
      expect(clauseAndOneChar).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should require quoted phrases to match exactly', async () => {
      const results = await backend.search(collections, '"me by title"');

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should not match a quoted phrase across separate fields', async () => {
      const results = await backend.search(collections, '"title find"');

      expect(results).toEqual({ entries: [] });
    });

    it('should apply inclusive date ranges', async () => {
      const datedPosts = [
        { ...posts[0], data: { ...posts[0].data, date: '2025-12-31T12:00:00Z' } },
        { ...posts[1], data: { ...posts[1].data, date: '2023-06-01' } },
        { path: 'posts/no-date.md', slug: 'no-date', data: { title: 'No date' } },
      ];
      backend.listAllEntries = vi.fn(collection => {
        if (collection.name === 'posts') {
          return Promise.resolve(datedPosts);
        }
        return Promise.resolve([]);
      });

      const results = await backend.search(
        [{ ...collections[0], search_fields: ['title', 'date'] }],
        'date:2025-01-01..2025-12-31',
      );

      expect(results).toEqual({ entries: [datedPosts[0]] });
    });

    it('should not include missing fields in numeric ranges', async () => {
      const rangedPosts = [
        { ...posts[0], data: { ...posts[0].data, count: 5 } },
        { ...posts[1], data: { ...posts[1].data } },
      ];
      backend.listAllEntries = vi.fn().mockResolvedValue(rangedPosts);

      const results = await backend.search(
        [{ ...collections[0], search_fields: ['title', 'count'] }],
        'count:0..10',
      );

      expect(results).toEqual({ entries: [rangedPosts[0]] });
    });

    it('should limit ordinary fuzzy searches to configured fields', async () => {
      const results = await backend.search(
        collections.map(collection => ({ ...collection, search_fields: ['description'] })),
        'find me by title',
      );

      expect(results).toEqual({ entries: [] });
    });

    it('should search collections by summary description', async () => {
      const results = await backend.search(
        collections.map(c => ({ ...c, summary: '{{description}}' })),
        'find me by description',
      );

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should search in file collection using top level fields', async () => {
      const collections = [
        {
          name: 'files',
          files: [
            {
              name: 'file1',
              fields: [{ name: 'author', widget: 'string' }],
            },
            {
              name: 'file2',
              fields: [{ name: 'other', widget: 'string' }],
            },
          ],
          type: FILES,
        },
      ];

      expect(await backend.search(collections, 'find me by author')).toEqual({
        entries: [files[0]],
      });
      expect(await backend.search(collections, 'find me by other')).toEqual({
        entries: [files[1]],
      });
    });

    it('should reject with a readable error when a collection fails to load entries', async () => {
      const loadError = new Error('failed to load pages entries');
      backend.listAllEntries = vi.fn(collection => {
        if (collection.name === 'posts') {
          return Promise.resolve(posts);
        }
        if (collection.name === 'pages') {
          return Promise.reject(loadError);
        }
        return Promise.resolve([]);
      });

      await expect(backend.search(collections, 'find me by title')).rejects.toMatchObject({
        message: expect.stringContaining('failed to load pages entries'),
        errors: [loadError],
      });
    });

    it('should query collections by title', async () => {
      const results = await backend.query(collections[0], ['title'], 'find me by title');

      expect(results).toEqual({
        hits: [posts[0]],
        query: 'find me by title',
      });
    });

    it('should query collections by slug', async () => {
      const results = await backend.query(collections[0], ['slug'], 'find-me');

      expect(results).toEqual({
        hits: [posts[0]],
        query: 'find-me',
      });
    });

    it('should query collections by path', async () => {
      const results = await backend.query(collections[0], ['path'], 'posts/find-me.md');

      expect(results).toEqual({
        hits: [posts[0]],
        query: 'posts/find-me.md',
      });
    });

    it('should query collections by nested field', async () => {
      const results = await backend.query(
        collections[0],
        ['nested.title'],
        'find me by nested title',
      );

      expect(results).toEqual({
        hits: [posts[0]],
        query: 'find me by nested title',
      });
    });
  });

  describe('expandSearchEntries', () => {
    it('should expand entry with list to multiple entries', () => {
      const entry = {
        data: {
          field: {
            nested: {
              list: [
                { id: 1, name: '1' },
                { id: 2, name: '2' },
              ],
            },
          },
          list: [1, 2],
        },
      };

      expect(expandSearchEntries([entry], ['list.*', 'field.nested.list.*.name'])).toEqual([
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'list.0',
        },
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'list.1',
        },
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'field.nested.list.0.name',
        },
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'field.nested.list.1.name',
        },
      ]);
    });
  });

  describe('mergeExpandedEntries', () => {
    it('should merge entries and filter data', () => {
      const expanded = [
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                  { id: 3, name: '3' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'field.nested.list.0.name',
        },
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                  { id: 3, name: '3' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'field.nested.list.3.name',
        },
      ];

      expect(mergeExpandedEntries(expanded)).toEqual([
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [1, 2],
          },
        },
      ]);
    });

    it('should merge entries and filter data based on different fields', () => {
      const expanded = [
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                  { id: 3, name: '3' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'field.nested.list.0.name',
        },
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                  { id: 3, name: '3' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'field.nested.list.3.name',
        },
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 2, name: '2' },
                  { id: 3, name: '3' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [1, 2],
          },
          field: 'list.1',
        },
      ];

      expect(mergeExpandedEntries(expanded)).toEqual([
        {
          data: {
            field: {
              nested: {
                list: [
                  { id: 1, name: '1' },
                  { id: 4, name: '4' },
                ],
              },
            },
            list: [2],
          },
        },
      ]);
    });

    it('should merge entries and keep sort by entry index', () => {
      const expanded = [
        {
          data: {
            list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
          field: 'list.5',
        },
        {
          data: {
            list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
          field: 'list.0',
        },
        {
          data: {
            list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
          field: 'list.11',
        },
        {
          data: {
            list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
          field: 'list.1',
        },
      ];

      expect(mergeExpandedEntries(expanded)).toEqual([
        {
          data: {
            list: [5, 0, 11, 1],
          },
        },
      ]);
    });
  });
});
