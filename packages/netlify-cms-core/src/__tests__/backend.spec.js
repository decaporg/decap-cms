import {
  resolveBackend,
  Backend,
  extractSearchFields,
  expandSearchEntries,
  mergeExpandedEntries,
} from '../backend';
import registry from 'Lib/registry';
import { FOLDER } from 'Constants/collectionTypes';
import { Map, List, fromJS } from 'immutable';
import { FILES } from '../constants/collectionTypes';

jest.mock('Lib/registry');
jest.mock('netlify-cms-lib-util');
jest.mock('../lib/urlHelper');

describe('Backend', () => {
  describe('filterEntries', () => {
    let backend;

    beforeEach(() => {
      registry.getBackend.mockReturnValue({
        init: jest.fn(),
      });
      backend = resolveBackend(
        Map({
          backend: Map({
            name: 'git-gateway',
          }),
        }),
      );
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
        Map({ field: 'testField', value: 'testValue' }),
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
        Map({ field: 'testField', value: 42 }),
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
        Map({ field: 'testField', value: false }),
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
        Map({ field: 'testField', value: 'testValue' }),
      );

      expect(result.length).toBe(1);
    });
  });

  describe('getLocalDraftBackup', () => {
    const { localForage, asyncLock } = require('netlify-cms-lib-util');

    asyncLock.mockImplementation(() => ({ acquire: jest.fn(), release: jest.fn() }));

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return empty object on no item', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = Map({
        name: 'posts',
      });
      const slug = 'slug';

      localForage.getItem.mockReturnValue();

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({});
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    it('should return empty object on item with empty content', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = Map({
        name: 'posts',
      });
      const slug = 'slug';

      localForage.getItem.mockReturnValue({ raw: '' });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({});
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });

    it('should return backup entry, empty media files and assets when only raw property was saved', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = Map({
        name: 'posts',
      });
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
          partial: false,
          raw: '---\ntitle: "Hello World"\n---\n',
          data: { title: 'Hello World' },
          meta: {},
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
        init: jest.fn(() => implementation),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = Map({
        name: 'posts',
      });
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
          partial: false,
          raw: '---\ntitle: "Hello World"\n---\n',
          data: { title: 'Hello World' },
          meta: {},
          label: null,
          isModification: null,
          status: '',
          updatedOn: '',
        },
      });
      expect(localForage.getItem).toHaveBeenCalledTimes(1);
      expect(localForage.getItem).toHaveBeenCalledWith('backup.posts.slug');
    });
  });

  describe('persistLocalDraftBackup', () => {
    const { localForage } = require('netlify-cms-lib-util');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not persist empty entry', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.entryToRaw = jest.fn().mockReturnValue('');

      const collection = Map({
        name: 'posts',
      });

      const slug = 'slug';

      const entry = Map({
        slug,
      });

      await backend.persistLocalDraftBackup(entry, collection);

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, entry);
      expect(localForage.setItem).toHaveBeenCalledTimes(0);
    });

    it('should persist non empty entry', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.entryToRaw = jest.fn().mockReturnValue('content');

      const collection = Map({
        name: 'posts',
      });

      const slug = 'slug';

      const entry = Map({
        slug,
        path: 'content/posts/entry.md',
        mediaFiles: List([{ id: '1' }]),
      });

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

  describe('persistMedia', () => {
    it('should persist media', async () => {
      const persistMediaResult = {};
      const implementation = {
        init: jest.fn(() => implementation),
        persistMedia: jest.fn().mockResolvedValue(persistMediaResult),
      };
      const config = Map({});

      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });
      backend.currentUser = jest.fn().mockResolvedValue(user);

      const file = { path: 'static/media/image.png' };

      const result = await backend.persistMedia(config, file);
      expect(result).toBe(persistMediaResult);
      expect(implementation.persistMedia).toHaveBeenCalledTimes(1);
      expect(implementation.persistMedia).toHaveBeenCalledWith(
        { path: 'static/media/image.png' },
        { commitMessage: 'Upload “static/media/image.png”' },
      );
    });
  });

  describe('unpublishedEntry', () => {
    it('should return unpublished entry', async () => {
      const unpublishedEntryResult = {
        diffs: [{ path: 'src/posts/index.md', newFile: false }, { path: 'netlify.png' }],
      };
      const implementation = {
        init: jest.fn(() => implementation),
        unpublishedEntry: jest.fn().mockResolvedValue(unpublishedEntryResult),
        unpublishedEntryDataFile: jest
          .fn()
          .mockResolvedValueOnce('---\ntitle: "Hello World"\n---\n'),
        unpublishedEntryMediaFile: jest.fn().mockResolvedValueOnce({ id: '1' }),
      };
      const config = Map({ media_folder: 'static/images' });

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = fromJS({
        name: 'posts',
        folder: 'src/posts',
        fields: [],
      });

      const state = {
        config,
        integrations: Map({}),
        mediaLibrary: Map({}),
      };

      const slug = 'slug';

      const result = await backend.unpublishedEntry(state, collection, slug);
      expect(result).toEqual({
        author: '',
        collection: 'posts',
        slug: '',
        path: 'src/posts/index.md',
        partial: false,
        raw: '---\ntitle: "Hello World"\n---\n',
        data: { title: 'Hello World' },
        meta: { path: 'src/posts/index.md' },
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
      jest.resetAllMocks();
    });

    it("should return unique slug when entry doesn't exist", async () => {
      const { sanitizeSlug } = require('../lib/urlHelper');
      sanitizeSlug.mockReturnValue('some-post-title');

      const config = Map({});

      const implementation = {
        init: jest.fn(() => implementation),
        getEntry: jest.fn(() => Promise.resolve()),
      };

      const collection = fromJS({
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
      });

      const entry = Map({
        title: 'some post title',
      });

      const backend = new Backend(implementation, { config, backendName: 'github' });

      await expect(backend.generateUniqueSlug(collection, entry, Map({}), [])).resolves.toBe(
        'sub_dir/some-post-title',
      );
    });

    it('should return unique slug when entry exists', async () => {
      const { sanitizeSlug, sanitizeChar } = require('../lib/urlHelper');
      sanitizeSlug.mockReturnValue('some-post-title');
      sanitizeChar.mockReturnValue('-');

      const config = Map({});

      const implementation = {
        init: jest.fn(() => implementation),
        getEntry: jest.fn(),
      };

      implementation.getEntry.mockResolvedValueOnce({ data: 'data' });
      implementation.getEntry.mockResolvedValueOnce();

      const collection = fromJS({
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
      });

      const entry = Map({
        title: 'some post title',
      });

      const backend = new Backend(implementation, { config, backendName: 'github' });

      await expect(backend.generateUniqueSlug(collection, entry, Map({}), [])).resolves.toBe(
        'sub_dir/some-post-title-1',
      );
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

  describe('search/query', () => {
    const collections = [
      fromJS({
        name: 'posts',
        folder: 'posts',
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'short_title', widget: 'string' },
          { name: 'author', widget: 'string' },
          { name: 'description', widget: 'string' },
          { name: 'nested', widget: 'object', fields: { name: 'title', widget: 'string' } },
        ],
      }),
      fromJS({
        name: 'pages',
        folder: 'pages',
        fields: [
          { name: 'title', widget: 'string' },
          { name: 'short_title', widget: 'string' },
          { name: 'author', widget: 'string' },
          { name: 'description', widget: 'string' },
          { name: 'nested', widget: 'object', fields: { name: 'title', widget: 'string' } },
        ],
      }),
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
      init: jest.fn(() => implementation),
    };
    const config = Map({});

    let backend;
    beforeEach(() => {
      backend = new Backend(implementation, { config, backendName: 'github' });
      backend.listAllEntries = jest.fn(collection => {
        if (collection.get('name') === 'posts') {
          return Promise.resolve(posts);
        }
        if (collection.get('name') === 'pages') {
          return Promise.resolve(pages);
        }
        if (collection.get('name') === 'files') {
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

    it('should search collections by summary description', async () => {
      const results = await backend.search(
        collections.map(c => c.set('summary', '{{description}}')),
        'find me by description',
      );

      expect(results).toEqual({
        entries: [posts[0], pages[0]],
      });
    });

    it('should search in file collection using top level fields', async () => {
      const collections = [
        fromJS({
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
        }),
      ];

      expect(await backend.search(collections, 'find me by author')).toEqual({
        entries: [files[0]],
      });
      expect(await backend.search(collections, 'find me by other')).toEqual({
        entries: [files[1]],
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

  describe('mergeMultipleContentEntries', () => {
    const implementation = {
      init: jest.fn(() => implementation),
    };
    const config = Map({});
    const backend = new Backend(implementation, { config, backendName: 'github' });

    it('should combine multiple content same folder entries', () => {
      const entries = [
        {
          path: 'posts/post.en.md',
          data: { title: 'Title en', content: 'Content en' },
          i18nStructure: 'locale_file_extensions',
          locale: 'en',
          contentKey: 'posts/post',
        },
        {
          path: 'posts/post.fr.md',
          data: { title: 'Title fr', content: 'Content fr' },
          i18nStructure: 'locale_file_extensions',
          locale: 'fr',
          contentKey: 'posts/post',
        },
      ];

      expect(backend.mergeMultipleContentEntries(entries)).toEqual([
        {
          path: 'posts/post.md',
          multiContent: true,
          raw: '',
          data: {
            en: { title: 'Title en', content: 'Content en' },
            fr: { title: 'Title fr', content: 'Content fr' },
          },
        },
      ]);
    });

    it('should combine multiple content different folder entries', () => {
      const entries = [
        {
          path: 'posts/en/post.md',
          data: { title: 'Title en', content: 'Content en' },
          i18nStructure: 'locale_folders',
          locale: 'en',
          contentKey: 'posts/post',
        },
        {
          path: 'posts/fr/post.md',
          data: { title: 'Title fr', content: 'Content fr' },
          i18nStructure: 'locale_folders',
          locale: 'fr',
          contentKey: 'posts/post',
        },
      ];

      expect(backend.mergeMultipleContentEntries(entries)).toEqual([
        {
          path: 'posts/post.md',
          multiContent: true,
          raw: '',
          data: {
            en: { title: 'Title en', content: 'Content en' },
            fr: { title: 'Title fr', content: 'Content fr' },
          },
        },
      ]);
    });
  });

  describe('listAllMultipleEntires', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    const implementation = {
      init: jest.fn(() => implementation),
    };
    const config = Map({});
    const backend = new Backend(implementation, { config, backendName: 'github' });

    it('should combine multiple content same folder entries', async () => {
      const entries = [
        {
          slug: 'post.en',
          path: 'posts/post.en.md',
          data: { title: 'Title en', content: 'Content en' },
        },
        {
          slug: 'post.fr',
          path: 'posts/post.fr.md',
          data: { title: 'Title fr', content: 'Content fr' },
        },
      ];
      const collection = fromJS({
        i18n_structure: 'locale_file_extensions',
        locales: ['en', 'fr'],
      });

      backend.listAllEntries = jest.fn().mockResolvedValue(entries);

      await expect(backend.listAllMultipleEntires(collection)).resolves.toEqual([
        {
          slug: 'post',
          path: 'posts/post.md',
          multiContent: true,
          raw: '',
          data: {
            en: { title: 'Title en', content: 'Content en' },
            fr: { title: 'Title fr', content: 'Content fr' },
          },
        },
      ]);
    });

    it('should combine multiple content different folder entries', async () => {
      const entries = [
        {
          slug: 'en/post',
          path: 'posts/en/post.md',
          data: { title: 'Title en', content: 'Content en' },
        },
        {
          slug: 'fr/post',
          path: 'posts/fr/post.md',
          data: { title: 'Title fr', content: 'Content fr' },
        },
      ];
      const collection = fromJS({ i18n_structure: 'locale_folders', locales: ['en', 'fr'] });

      backend.listAllEntries = jest.fn().mockResolvedValue(entries);

      await expect(backend.listAllMultipleEntires(collection)).resolves.toEqual([
        {
          slug: 'post',
          path: 'posts/post.md',
          multiContent: true,
          raw: '',
          data: {
            en: { title: 'Title en', content: 'Content en' },
            fr: { title: 'Title fr', content: 'Content fr' },
          },
        },
      ]);
    });
  });

  describe('getMultipleEntries', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    const implementation = {
      init: jest.fn(() => implementation),
    };
    const config = Map({});
    const backend = new Backend(implementation, { config, backendName: 'github' });
    const entryDraft = fromJS({
      entry: {
        data: {
          en: { title: 'post', content: 'Content en' },
          fr: { title: 'publier', content: 'Content fr' },
        },
      },
    });
    const entryObj = { path: 'posts/post.md', slug: 'post' };

    it('should split multiple content into different locale file entries', async () => {
      const collection = fromJS({
        i18n_structure: 'locale_file_extensions',
        fields: [{ name: 'title' }, { name: 'content' }],
        extension: 'md',
      });

      expect(backend.getMultipleEntries(collection, entryDraft, entryObj)).toEqual([
        {
          slug: 'post',
          path: 'posts/post.en.md',
          raw: '---\ntitle: post\ncontent: Content en\n---\n',
        },
        {
          slug: 'post',
          path: 'posts/post.fr.md',
          raw: '---\ntitle: publier\ncontent: Content fr\n---\n',
        },
      ]);
    });

    it('should split multiple content into different locale folder entries', async () => {
      const collection = fromJS({
        i18n_structure: 'locale_folders',
        fields: [{ name: 'title' }, { name: 'content' }],
        extension: 'md',
      });

      expect(backend.getMultipleEntries(collection, entryDraft, entryObj)).toEqual([
        {
          slug: 'post',
          path: 'posts/en/post.md',
          raw: '---\ntitle: post\ncontent: Content en\n---\n',
        },
        {
          slug: 'post',
          path: 'posts/fr/post.md',
          raw: '---\ntitle: publier\ncontent: Content fr\n---\n',
        },
      ]);
    });
  });
});
