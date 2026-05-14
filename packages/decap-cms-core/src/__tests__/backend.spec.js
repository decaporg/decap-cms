import { Map, List, fromJS } from 'immutable';

import {
  resolveBackend,
  Backend,
  extractSearchFields,
  expandSearchEntries,
  mergeExpandedEntries,
} from '../backend';
import { getBackend } from '../lib/registry';
import { FOLDER, FILES } from '../constants/collectionTypes';

jest.mock('../lib/registry');
jest.mock('decap-cms-lib-util');
jest.mock('../lib/urlHelper');

describe('Backend', () => {
  describe('filterEntries', () => {
    let backend;

    beforeEach(() => {
      getBackend.mockReturnValue({
        init: jest.fn(),
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
    const { localForage, asyncLock } = require('decap-cms-lib-util');

    asyncLock.mockImplementation(() => ({ acquire: jest.fn(), release: jest.fn() }));

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return empty object on no item', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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
      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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
        init: jest.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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
  });

  describe('persistLocalDraftBackup', () => {
    const { localForage } = require('decap-cms-lib-util');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not persist empty entry', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
      };

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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

  describe('persistEntry', () => {
    it('should update the draft with the new entry returned by preSave event', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
        persistEntry: jest.fn(() => implementation),
      };

      const config = {
        backend: {
          commit_messages: 'commit-messages',
        },
      };
      const collection = Map({
        name: 'posts',
      });
      const entry = Map({
        data: 'old_data',
      });
      const newEntry = Map({
        data: 'new_data',
      });
      const entryDraft = Map({
        entry,
      });
      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.currentUser = jest.fn().mockResolvedValue(user);
      backend.entryToRaw = jest.fn().mockReturnValue('content');
      backend.invokePreSaveEvent = jest.fn().mockReturnValueOnce(newEntry);

      await backend.persistEntry({ config, collection, entryDraft });

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, newEntry);
    });

    it('should update the draft with the new data returned by preSave event', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
        persistEntry: jest.fn(() => implementation),
      };

      const config = {
        backend: {
          commit_messages: 'commit-messages',
        },
      };
      const collection = Map({
        name: 'posts',
      });
      const entry = Map({
        data: Map({}),
      });
      const newData = Map({});
      const newEntry = Map({
        data: newData,
      });
      const entryDraft = Map({
        entry,
      });
      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.currentUser = jest.fn().mockResolvedValue(user);
      backend.entryToRaw = jest.fn().mockReturnValue('content');
      backend.invokePreSaveEvent = jest.fn().mockReturnValueOnce(newData);

      await backend.persistEntry({ config, collection, entryDraft });

      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      expect(backend.entryToRaw).toHaveBeenCalledWith(collection, newEntry);
    });

    it('should preserve slug when preSave event handler modifies file collection entry', async () => {
      const implementation = {
        init: jest.fn(() => implementation),
        persistEntry: jest.fn(() => implementation),
      };

      const config = {
        backend: {
          commit_messages: 'commit-messages',
        },
      };

      // File collection with a single file
      const collection = Map({
        name: 'settings',
        type: FILES,
        files: List([
          Map({
            name: 'config',
            file: 'data/config.json',
            fields: List([Map({ name: 'title', widget: 'string' })]),
          }),
        ]),
      });

      const originalEntry = Map({
        slug: 'config',
        path: 'data/config.json',
        data: Map({ title: 'original' }),
        meta: Map({ path: 'data/config.json' }),
      });

      const entryDraft = Map({
        entry: originalEntry,
      });

      const user = { login: 'login', name: 'name' };
      const backend = new Backend(implementation, { config, backendName: 'github' });

      backend.currentUser = jest.fn().mockResolvedValue(user);
      backend.entryToRaw = jest.fn().mockReturnValue('content');

      // Mock invokePreSaveEvent to simulate a preSave handler that modifies data
      // This is what happens when custom widgets or event handlers modify entry data
      // The key is that it returns the FULL entry with slug, not just the data
      backend.invokePreSaveEvent = jest.fn().mockImplementation(async entry => {
        // Simulate a preSave handler modifying the data field
        return entry.setIn(['data', 'title'], 'modified');
      });

      await backend.persistEntry({ config, collection, entryDraft });

      // Verify entryToRaw was called with an entry that has the slug
      expect(backend.entryToRaw).toHaveBeenCalledTimes(1);
      const entryPassedToRaw = backend.entryToRaw.mock.calls[0][1];

      // Critical assertion: slug must be preserved
      expect(entryPassedToRaw.get('slug')).toBe('config');
      expect(entryPassedToRaw.get('path')).toBe('data/config.json');
      expect(entryPassedToRaw.getIn(['data', 'title'])).toBe('modified');
    });
  });

  describe('persistMedia', () => {
    it('should persist media', async () => {
      const persistMediaResult = {};
      const implementation = {
        init: jest.fn(() => implementation),
        persistMedia: jest.fn().mockResolvedValue(persistMediaResult),
      };
      const config = { backend: { name: 'github' } };

      const backend = new Backend(implementation, { config, backendName: config.backend.name });
      const user = { login: 'login', name: 'name' };
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
      const config = {
        media_folder: 'static/images',
      };

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
      jest.resetAllMocks();
    });

    it("should return unique slug when entry doesn't exist", async () => {
      const { sanitizeSlug } = require('../lib/urlHelper');
      sanitizeSlug.mockReturnValue('some-post-title');

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

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

      await expect(backend.generateUniqueSlug(collection, entry, Map({}), [])).resolves.toBe(
        'sub_dir/some-post-title',
      );
    });

    it('should return unique slug when entry exists', async () => {
      const { sanitizeSlug, sanitizeChar } = require('../lib/urlHelper');
      sanitizeSlug.mockReturnValue('some-post-title');
      sanitizeChar.mockReturnValue('-');

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

      const backend = new Backend(implementation, { config: {}, backendName: 'github' });

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

    let backend;
    beforeEach(() => {
      backend = new Backend(implementation, { config: {}, backendName: 'github' });
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
});
