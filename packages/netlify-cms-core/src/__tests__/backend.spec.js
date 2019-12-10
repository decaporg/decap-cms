import { resolveBackend, Backend } from '../backend';
import registry from 'Lib/registry';
import { FOLDER } from 'Constants/collectionTypes';
import { Map, List, fromJS } from 'immutable';

jest.mock('Lib/registry');
jest.mock('netlify-cms-lib-util');
jest.mock('Formats/formats');
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
    const { localForage } = require('netlify-cms-lib-util');

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
        raw: 'content',
      });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({
        entry: {
          mediaFiles: [],
          collection: 'posts',
          slug: 'slug',
          path: '',
          partial: false,
          raw: 'content',
          data: {},
          label: null,
          metaData: null,
          isModification: null,
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
        raw: 'content',
        mediaFiles: [{ id: '1' }],
      });

      const result = await backend.getLocalDraftBackup(collection, slug);

      expect(result).toEqual({
        entry: {
          mediaFiles: [{ id: '1' }],
          collection: 'posts',
          slug: 'slug',
          path: '',
          partial: false,
          raw: 'content',
          data: {},
          label: null,
          metaData: null,
          isModification: null,
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
        file: { path: 'path' },
        isModification: true,
        metaData: {},
        mediaFiles: [{ id: '1' }],
        data: 'content',
      };
      const implementation = {
        init: jest.fn(() => implementation),
        unpublishedEntry: jest.fn().mockResolvedValue(unpublishedEntryResult),
      };
      const config = Map({});

      const backend = new Backend(implementation, { config, backendName: 'github' });

      const collection = Map({
        name: 'posts',
      });

      const slug = 'slug';

      const result = await backend.unpublishedEntry(collection, slug);
      expect(result).toEqual({
        collection: 'posts',
        slug: '',
        path: 'path',
        partial: false,
        raw: 'content',
        data: {},
        label: null,
        metaData: {},
        isModification: true,
        mediaFiles: [{ id: '1' }],
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
});
