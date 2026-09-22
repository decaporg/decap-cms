import { fromJS, List, Map } from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  createEmptyDraft,
  createEmptyDraftData,
  retrieveLocalBackup,
  persistLocalBackup,
  getMediaAssets,
  persistEntry,
  validateMetaField,
} from '../entries';
import AssetProxy from '../../valueObjects/AssetProxy';

jest.mock('../../backend');
jest.mock('decap-cms-lib-util');
jest.mock('../mediaLibrary');
jest.mock('../../reducers/entries');
jest.mock('../../reducers/entryDraft');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('entries', () => {
  describe('createEmptyDraft', () => {
    const { currentBackend } = require('../../backend');
    const backend = {
      processEntry: jest.fn((_state, _collection, entry) => Promise.resolve(entry)),
    };

    currentBackend.mockReturnValue(backend);

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should dispatch draft created action', () => {
      const store = mockStore({ mediaLibrary: fromJS({ files: [] }) });

      const collection = fromJS({
        fields: [{ name: 'title' }],
      });

      return store.dispatch(createEmptyDraft(collection, '')).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(1);

        expect(actions[0]).toEqual({
          payload: {
            author: '',
            collection: undefined,
            data: {},
            meta: {},
            i18n: {},
            isModification: null,
            label: null,
            mediaFiles: [],
            partial: false,
            path: '',
            raw: '',
            slug: '',
            status: '',
            updatedOn: '',
          },
          type: 'DRAFT_CREATE_EMPTY',
        });
      });
    });

    it('should populate draft entry from URL param', () => {
      const store = mockStore({ mediaLibrary: fromJS({ files: [] }) });

      const collection = fromJS({
        fields: [{ name: 'title' }, { name: 'boolean' }],
      });

      return store.dispatch(createEmptyDraft(collection, '?title=title&boolean=True')).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(1);

        expect(actions[0]).toEqual({
          payload: {
            author: '',
            collection: undefined,
            data: { title: 'title', boolean: true },
            meta: {},
            i18n: {},
            isModification: null,
            label: null,
            mediaFiles: [],
            partial: false,
            path: '',
            raw: '',
            slug: '',
            status: '',
            updatedOn: '',
          },
          type: 'DRAFT_CREATE_EMPTY',
        });
      });
    });

    it('should populate draft entry from repeated URL param', () => {
      const store = mockStore({ mediaLibrary: fromJS({ files: [] }) });

      const collection = fromJS({
        fields: [{ name: 'post', multiple: true }],
      });

      return store
        .dispatch(createEmptyDraft(collection, '?post=2026-05-07-test&post=2026-05-08-test'))
        .then(() => {
          const actions = store.getActions();
          expect(actions).toHaveLength(1);

          expect(actions[0]).toEqual({
            payload: {
              author: '',
              collection: undefined,
              data: { post: List(['2026-05-07-test', '2026-05-08-test']) },
              meta: {},
              i18n: {},
              isModification: null,
              label: null,
              mediaFiles: [],
              partial: false,
              path: '',
              raw: '',
              slug: '',
              status: '',
              updatedOn: '',
            },
            type: 'DRAFT_CREATE_EMPTY',
          });
        });
    });

    it('should html escape URL params', () => {
      const store = mockStore({ mediaLibrary: fromJS({ files: [] }) });

      const collection = fromJS({
        fields: [{ name: 'title' }],
      });

      return store
        .dispatch(createEmptyDraft(collection, "?title=<script>alert('hello')</script>"))
        .then(() => {
          const actions = store.getActions();
          expect(actions).toHaveLength(1);

          expect(actions[0]).toEqual({
            payload: {
              author: '',
              collection: undefined,
              data: { title: '&lt;script&gt;alert(&#039;hello&#039;)&lt;/script&gt;' },
              meta: {},
              i18n: {},
              isModification: null,
              label: null,
              mediaFiles: [],
              partial: false,
              path: '',
              raw: '',
              slug: '',
              status: '',
              updatedOn: '',
            },
            type: 'DRAFT_CREATE_EMPTY',
          });
        });
    });
  });
  describe('createEmptyDraftData', () => {
    it('should allow an empty array as list default for a single field list', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          default: [],
          field: { name: 'url', widget: 'text' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ images: fromJS([]) });
    });

    it('should allow a complex array as list default for a single field list', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          default: [
            {
              url: 'https://image.png',
            },
          ],
          field: { name: 'url', widget: 'text' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        images: fromJS([
          {
            url: 'https://image.png',
          },
        ]),
      });
    });

    it('should allow an empty array as list default for a fields list', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          default: [],
          fields: [
            { name: 'title', widget: 'text' },
            { name: 'url', widget: 'text' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ images: fromJS([]) });
    });

    it('should allow a complex array as list default for a fields list', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          default: [
            {
              title: 'default image',
              url: 'https://image.png',
            },
          ],
          fields: [
            { name: 'title', widget: 'text' },
            { name: 'url', widget: 'text' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        images: fromJS([
          {
            title: 'default image',
            url: 'https://image.png',
          },
        ]),
      });
    });

    it('should use field default when no list default is provided', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          field: { name: 'url', widget: 'text', default: 'https://image.png' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ images: [{ url: 'https://image.png' }] });
    });

    it('should use fields default when no list default is provided', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          fields: [
            { name: 'title', widget: 'text', default: 'default image' },
            { name: 'url', widget: 'text', default: 'https://image.png' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        images: [{ title: 'default image', url: 'https://image.png' }],
      });
    });

    it('should not set empty value for list fields widget', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          fields: [
            { name: 'title', widget: 'text' },
            { name: 'url', widget: 'text' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({});
    });

    it('should set default value for object field widget', () => {
      const fields = fromJS([
        {
          name: 'post',
          widget: 'object',
          field: { name: 'image', widget: 'text', default: 'https://image.png' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ post: { image: 'https://image.png' } });
    });

    it('should set default values for object fields widget', () => {
      const fields = fromJS([
        {
          name: 'post',
          widget: 'object',
          fields: [
            { name: 'title', widget: 'text', default: 'default title' },
            { name: 'url', widget: 'text', default: 'https://image.png' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        post: { title: 'default title', url: 'https://image.png' },
      });
    });

    it('should not set empty value for object fields widget', () => {
      const fields = fromJS([
        {
          name: 'post',
          widget: 'object',
          fields: [
            { name: 'title', widget: 'text' },
            { name: 'url', widget: 'text' },
          ],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({});
    });

    it('should populate nested fields', () => {
      const fields = fromJS([
        {
          name: 'names',
          widget: 'list',
          field: {
            name: 'object',
            widget: 'object',
            fields: [
              { name: 'first', widget: 'string', default: 'first' },
              { name: 'second', widget: 'string', default: 'second' },
            ],
          },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({
        names: [{ object: { first: 'first', second: 'second' } }],
      });
    });
  });

  describe('persistLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should persist local backup with media files', () => {
      const { currentBackend } = require('../../backend');

      const backend = {
        persistLocalDraftBackup: jest.fn(() => Promise.resolve()),
      };

      const store = mockStore({
        config: Map(),
      });

      currentBackend.mockReturnValue(backend);

      const collection = Map();
      const mediaFiles = [{ path: 'static/media/image.png' }];
      const entry = fromJS({ mediaFiles });

      return store.dispatch(persistLocalBackup(entry, collection)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(0);

        expect(backend.persistLocalDraftBackup).toHaveBeenCalledTimes(1);
        expect(backend.persistLocalDraftBackup).toHaveBeenCalledWith(entry, collection);
      });
    });
  });

  describe('retrieveLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should retrieve media files with local backup', () => {
      const { currentBackend } = require('../../backend');
      const { createAssetProxy } = require('../../valueObjects/AssetProxy');

      const backend = {
        getLocalDraftBackup: jest.fn((...args) => args),
      };

      const store = mockStore({
        config: Map(),
      });

      currentBackend.mockReturnValue(backend);

      const collection = Map({
        name: 'collection',
      });
      const slug = 'slug';

      const file = new File([], 'image.png');
      const mediaFiles = [{ path: 'static/media/image.png', url: 'url', file }];
      const asset = createAssetProxy(mediaFiles[0]);
      const entry = { mediaFiles };

      backend.getLocalDraftBackup.mockReturnValue({ entry });

      return store.dispatch(retrieveLocalBackup(collection, slug)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(2);

        expect(actions[0]).toEqual({
          type: 'ADD_ASSETS',
          payload: [asset],
        });
        expect(actions[1]).toEqual({
          type: 'DRAFT_LOCAL_BACKUP_RETRIEVED',
          payload: { entry },
        });
      });
    });
  });

  describe('getMediaAssets', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should map mediaFiles to assets', () => {
      const mediaFiles = fromJS([{ path: 'path1' }, { path: 'path2', draft: true }]);

      const entry = Map({ mediaFiles });
      expect(getMediaAssets({ entry })).toEqual([new AssetProxy({ path: 'path2' })]);
    });
  });

  describe('validateMetaField', () => {
    const state = {
      config: {
        slug: {
          encoding: 'unicode',
          clean_accents: false,
          sanitize_replacement: '-',
        },
      },
      entries: fromJS([]),
    };
    const collection = fromJS({
      folder: 'folder',
      type: 'folder_based_collection',
      name: 'name',
    });
    const t = jest.fn((key, args) => ({ key, args }));

    const { selectCustomPath } = require('../../reducers/entryDraft');
    const { selectEntryByPath } = require('../../reducers/entries');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not return error on non meta field', () => {
      expect(validateMetaField(null, null, fromJS({}), null, t)).toEqual({ error: false });
    });

    it('should not return error on meta path field', () => {
      expect(validateMetaField(null, null, fromJS({ meta: true, name: 'other' }), null, t)).toEqual(
        { error: false },
      );
    });

    it('should return error on empty path', () => {
      expect(validateMetaField(null, null, fromJS({ meta: true, name: 'path' }), null, t)).toEqual({
        error: {
          message: {
            key: 'editor.editorControlPane.widget.invalidPath',
            args: { path: null },
          },
          type: 'CUSTOM',
        },
      });

      expect(
        validateMetaField(null, null, fromJS({ meta: true, name: 'path' }), undefined, t),
      ).toEqual({
        error: {
          message: {
            key: 'editor.editorControlPane.widget.invalidPath',
            args: { path: undefined },
          },
          type: 'CUSTOM',
        },
      });

      expect(validateMetaField(null, null, fromJS({ meta: true, name: 'path' }), '', t)).toEqual({
        error: {
          message: {
            key: 'editor.editorControlPane.widget.invalidPath',
            args: { path: '' },
          },
          type: 'CUSTOM',
        },
      });
    });

    it('should return error on invalid path', () => {
      expect(
        validateMetaField(state, null, fromJS({ meta: true, name: 'path' }), 'invalid path', t),
      ).toEqual({
        error: {
          message: {
            key: 'editor.editorControlPane.widget.invalidPath',
            args: { path: 'invalid path' },
          },
          type: 'CUSTOM',
        },
      });
    });

    it('should return error on existing path', () => {
      selectCustomPath.mockReturnValue('existing-path');
      selectEntryByPath.mockReturnValue(fromJS({ path: 'existing-path' }));
      expect(
        validateMetaField(
          {
            ...state,
            entryDraft: fromJS({
              entry: {},
            }),
          },
          collection,
          fromJS({ meta: true, name: 'path' }),
          'existing-path',
          t,
        ),
      ).toEqual({
        error: {
          message: {
            key: 'editor.editorControlPane.widget.pathExists',
            args: { path: 'existing-path' },
          },
          type: 'CUSTOM',
        },
      });

      expect(selectCustomPath).toHaveBeenCalledTimes(1);
      expect(selectCustomPath).toHaveBeenCalledWith(
        collection,
        fromJS({ entry: { meta: { path: 'existing-path' } } }),
      );

      expect(selectEntryByPath).toHaveBeenCalledTimes(1);
      expect(selectEntryByPath).toHaveBeenCalledWith(
        state.entries,
        collection.get('name'),
        'existing-path',
      );
    });

    it('should not return error on non existing path for new entry', () => {
      selectCustomPath.mockReturnValue('non-existing-path');
      selectEntryByPath.mockReturnValue(undefined);
      expect(
        validateMetaField(
          {
            ...state,
            entryDraft: fromJS({
              entry: {},
            }),
          },
          collection,
          fromJS({ meta: true, name: 'path' }),
          'non-existing-path',
          t,
        ),
      ).toEqual({
        error: false,
      });
    });

    it('should not return error when for existing entry', () => {
      selectCustomPath.mockReturnValue('existing-path');
      selectEntryByPath.mockReturnValue(fromJS({ path: 'existing-path' }));
      expect(
        validateMetaField(
          {
            ...state,
            entryDraft: fromJS({
              entry: { path: 'existing-path' },
            }),
          },
          collection,
          fromJS({ meta: true, name: 'path' }),
          'existing-path',
          t,
        ),
      ).toEqual({
        error: false,
      });
    });
  });

  describe('persistEntry', () => {
    const { currentBackend } = require('../../backend');
    const { loadMedia } = require('../mediaLibrary');
    const { selectPublishedSlugs } = require('../../reducers/entries');
    const collections = require('../../reducers/collections');

    // `type` matters: selectFields dispatches on it, and this suite does not
    // mock reducers/collections.
    const collection = fromJS({
      name: 'posts',
      type: 'folder',
      folder: 'content',
      fields: [{ name: 'title' }],
    });

    function storeWithDraft() {
      return mockStore({
        config: fromJS({}),
        collections: fromJS({ posts: collection }),
        entryDraft: fromJS({
          entry: {
            slug: 'hello',
            path: 'content/hello.md',
            data: { title: 'Hello' },
            mediaFiles: [],
          },
          fieldsErrors: {},
        }),
        mediaLibrary: fromJS({ files: [] }),
      });
    }

    function typesOf(store) {
      return store.getActions().map(action => action.type);
    }

    beforeEach(() => {
      jest.clearAllMocks();
      selectPublishedSlugs.mockReturnValue(List());
      loadMedia.mockReturnValue({ type: 'MEDIA_LOAD_SUCCESS' });
      // reducers/collections is not mocked by this suite, and its real
      // selectFields keys a selector map on constants that come from the
      // auto-mocked decap-cms-lib-util — so they are undefined here. Stub the
      // one function this path needs rather than mocking the whole module.
      jest.spyOn(collections, 'selectFields').mockReturnValue(List());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    // Characterization of a plain save: request, commit, toast, release, and
    // nothing else. Note this one passes with or without the B3 reordering —
    // with no assets there is no media reload to be ordered against. It is
    // here to pin the sequence, not to guard the change; the test below is
    // what guards the change.
    it('dispatches request, toast and release in order for a save with no media', async () => {
      currentBackend.mockReturnValue({
        persistEntry: jest.fn().mockResolvedValue('hello'),
        implementation: {},
      });

      const store = storeWithDraft();
      await store.dispatch(persistEntry(collection));

      expect(typesOf(store)).toEqual([
        'ENTRY_PERSIST_REQUEST',
        'NOTIFICATION_SEND',
        'ENTRY_PERSIST_SUCCESS',
      ]);
      expect(loadMedia).not.toHaveBeenCalled();
    });

    // THE guard for B3. entryPersisted used to be dispatched after an awaited
    // loadMedia(), so saving an entry with images held the save spinner
    // through a refresh of a panel that is not even on screen. Verified to
    // fail against the previous ordering.
    it('releases the editor before reloading the media library', async () => {
      let mediaReloadStarted = false;
      loadMedia.mockImplementation(() => {
        mediaReloadStarted = true;
        return { type: 'MEDIA_LOAD_SUCCESS' };
      });

      currentBackend.mockReturnValue({
        persistEntry: jest.fn().mockResolvedValue('hello'),
        implementation: {},
      });

      const asset = new AssetProxy({ path: 'static/img/a.png', file: new File([''], 'a.png') });
      const store = mockStore({
        config: fromJS({}),
        collections: fromJS({ posts: collection }),
        entryDraft: fromJS({
          entry: {
            slug: 'hello',
            path: 'content/hello.md',
            data: { title: 'Hello' },
            mediaFiles: [{ path: 'static/img/a.png', draft: true, ...asset }],
          },
          fieldsErrors: {},
        }),
        mediaLibrary: fromJS({ files: [] }),
      });

      await store.dispatch(persistEntry(collection));

      // Asserted, not guarded by an `if`: a fixture that stopped producing
      // asset proxies would make the ordering assertion below vacuous and this
      // test would pass while guarding nothing.
      expect(mediaReloadStarted).toBe(true);

      const types = typesOf(store);
      expect(types.indexOf('ENTRY_PERSIST_SUCCESS')).toBeLessThan(
        types.indexOf('MEDIA_LOAD_SUCCESS'),
      );
    });

    it('does not release the editor when the commit fails', async () => {
      currentBackend.mockReturnValue({
        persistEntry: jest.fn().mockRejectedValue(new Error('conflict')),
        implementation: {},
      });

      const store = storeWithDraft();
      await expect(store.dispatch(persistEntry(collection))).rejects.toBeDefined();

      const types = typesOf(store);
      expect(types).toContain('ENTRY_PERSIST_FAILURE');
      expect(types).not.toContain('ENTRY_PERSIST_SUCCESS');
      expect(loadMedia).not.toHaveBeenCalled();
    });
  });
});
