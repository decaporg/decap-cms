import configureMockStore from 'redux-mock-store';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';
import { generateContentKey } from 'decap-cms-lib-util';

import { addAssets } from '../media';
import * as actions from '../editorialWorkflow';

jest.mock('../../backend');
jest.mock('../../valueObjects/AssetProxy');
jest.mock('decap-cms-lib-util');
global.crypto.randomUUID = jest.fn().mockReturnValue('000000000000000000000');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('editorialWorkflow actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The module is automocked, so this would otherwise return undefined and
    // every workflow-key comparison below would silently miss. It is the same
    // one-liner the real module exports, and sharing it is the point: the key
    // the reducer stores and the key this action looks up have to agree.
    generateContentKey.mockImplementation((collection, slug) => `${collection}/${slug}`);
  });

  describe('loadUnpublishedEntry', () => {
    it('should load unpublished entry', () => {
      const { currentBackend } = require('../../backend');
      const { createAssetProxy } = require('../../valueObjects/AssetProxy');

      const assetProxy = { name: 'name', path: 'path' };
      const entry = { mediaFiles: [{ file: { name: 'name' }, id: '1', draft: true }] };
      const backend = {
        unpublishedEntry: jest.fn().mockResolvedValue(entry),
        unpublishedContentKeys: jest.fn(),
      };

      const store = mockStore({
        config: fromJS({
          editor: { notes: true },
        }),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
        mediaLibrary: fromJS({
          isLoading: false,
        }),
        editorialWorkflow: fromJS({
          pages: { keys: ['posts/slug'] },
          entities: { 'posts.slug': { collection: 'posts', slug: 'slug' } },
        }),
      });

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockResolvedValue(assetProxy);

      const slug = 'slug';
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, slug)).then(() => {
        // A known key goes straight to the per-slug lookup, which is
        // authoritative, so refreshing the set first would be pure latency.
        expect(backend.unpublishedContentKeys).not.toHaveBeenCalled();
        const actions = store.getActions();
        expect(actions).toHaveLength(4);
        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual(addAssets([assetProxy]));
        expect(actions[2]).toEqual({
          type: 'UNPUBLISHED_ENTRY_SUCCESS',
          payload: {
            collection: 'posts',
            entry: { ...entry, mediaFiles: [{ file: { name: 'name' }, id: '1', draft: true }] },
          },
        });
        expect(actions[3]).toEqual({
          type: 'DRAFT_CREATE_FROM_ENTRY',
          payload: {
            entry,
          },
        });
      });
    });

    it("detects a colleague's draft created since the key set was loaded", () => {
      const { currentBackend } = require('../../backend');

      const draft = { collection: 'posts', slug: 'slug', mediaFiles: [] };
      const backend = {
        unpublishedContentKeys: jest.fn().mockResolvedValue(['posts/other', 'posts/slug']),
        unpublishedEntries: jest.fn(),
        unpublishedEntry: jest.fn().mockResolvedValue(draft),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        entries: fromJS({}),
        editorialWorkflow: fromJS({
          pages: { keys: ['posts/other'] },
          entities: { 'posts.other': { collection: 'posts', slug: 'other' } },
        }),
      });

      currentBackend.mockReturnValue(backend);
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        expect(backend.unpublishedContentKeys).toHaveBeenCalledTimes(1);
        // The keys, not the drafts behind them.
        expect(backend.unpublishedEntries).not.toHaveBeenCalled();
        expect(backend.unpublishedEntry).toHaveBeenCalled();

        const types = store.getActions().map(a => a.type);
        expect(types).toContain('UNPUBLISHED_KEYS_SUCCESS');
        expect(types).toContain('UNPUBLISHED_ENTRY_REQUEST');
        expect(types).not.toContain('UNPUBLISHED_ENTRY_REDIRECT');
      });
    });

    it('redirects to the published entry after one key request confirms the slug is absent', () => {
      const { currentBackend } = require('../../backend');

      const backend = {
        unpublishedContentKeys: jest.fn().mockResolvedValue(['posts/other']),
        unpublishedEntries: jest.fn(),
        unpublishedEntry: jest.fn(),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        entries: fromJS({}),
        editorialWorkflow: fromJS({
          pages: { keys: ['posts/other'] },
          entities: { 'posts.other': { collection: 'posts', slug: 'other' } },
        }),
      });

      currentBackend.mockReturnValue(backend);
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        expect(backend.unpublishedContentKeys).toHaveBeenCalledTimes(1);
        expect(backend.unpublishedEntry).not.toHaveBeenCalled();
        expect(backend.unpublishedEntries).not.toHaveBeenCalled();
        expect(store.getActions()[1]).toEqual({
          type: 'UNPUBLISHED_ENTRY_REDIRECT',
          payload: { collection: 'posts', slug: 'slug' },
        });
      });
    });

    it('keeps a draft this session saved when a later listing predates the commit', async () => {
      const { currentBackend } = require('../../backend');
      const editorialWorkflow = require('../../reducers/editorialWorkflow').default;

      const draft = { collection: 'posts', slug: 'just-saved', mediaFiles: [] };
      const backend = {
        unpublishedContentKeys: jest.fn().mockResolvedValue([]),
        unpublishedEntries: jest.fn(),
        unpublishedEntry: jest.fn().mockResolvedValue(draft),
      };
      currentBackend.mockReturnValue(backend);

      function fixed(value) {
        return (state = value) => state;
      }
      const store = createStore(
        combineReducers({
          config: fixed(fromJS({ editor: { notes: true } })),
          collections: fixed(fromJS({ posts: { name: 'posts' } })),
          mediaLibrary: fixed(fromJS({ isLoading: false })),
          entries: fixed(fromJS({})),
          editorialWorkflow,
        }),
        { editorialWorkflow: fromJS({ pages: { keys: [] }, entities: {} }) },
        applyMiddleware(thunk),
      );
      const collection = store.getState().collections.get('posts');

      store.dispatch({
        type: 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS',
        payload: { collection: 'posts', entry: fromJS({ slug: 'just-saved' }), slug: 'just-saved' },
      });
      // Opening another entry refreshes the keys with a listing taken before
      // that commit landed.
      await store.dispatch(actions.loadUnpublishedEntry(collection, 'other'));
      backend.unpublishedContentKeys.mockClear();

      await store.dispatch(actions.loadUnpublishedEntry(collection, 'just-saved'));

      expect(backend.unpublishedContentKeys).not.toHaveBeenCalled();
      expect(backend.unpublishedEntry).toHaveBeenCalledWith(
        expect.anything(),
        collection,
        'just-saved',
      );
    });

    it('asks the backend per slug when the key refresh fails', () => {
      const { currentBackend } = require('../../backend');

      const backend = {
        unpublishedContentKeys: jest.fn().mockRejectedValue(new Error('offline')),
        unpublishedEntry: jest.fn().mockRejectedValue(new Error('nope')),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        // A set from earlier in the session must not be trusted once the
        // refresh that would confirm it has failed.
        editorialWorkflow: fromJS({ pages: { keys: ['posts/other'] } }),
      });

      currentBackend.mockReturnValue(backend);
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        expect(backend.unpublishedContentKeys).toHaveBeenCalledTimes(1);
        expect(backend.unpublishedEntry).toHaveBeenCalled();
        expect(store.getActions().map(a => a.type)).not.toContain('UNPUBLISHED_ENTRY_REDIRECT');
      });
    });

    it('still asks the backend when the unpublished list has never loaded', () => {
      const { currentBackend } = require('../../backend');

      const backend = {
        unpublishedContentKeys: jest.fn().mockRejectedValue(new Error('offline')),
        unpublishedEntries: jest.fn().mockRejectedValue(new Error('offline')),
        unpublishedEntry: jest.fn().mockRejectedValue(new Error('nope')),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        // No `pages`, so nothing is known — a failed or never-run refresh must
        // not be mistaken for "confirmed and empty".
        editorialWorkflow: fromJS({}),
      });

      currentBackend.mockReturnValue(backend);

      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        expect(backend.unpublishedEntry).toHaveBeenCalled();
      });
    });
  });

  describe('loadUnpublishedEntries', () => {
    it('does not start another request while entries are loading', () => {
      const { currentBackend } = require('../../backend');
      const backend = { unpublishedEntries: jest.fn() };
      const store = mockStore({
        // Plain object, not fromJS: config left Immutable, and the guard reads
        // `state.config.publish_mode` directly — an Immutable Map here makes it
        // undefined, so the publish-mode check returns early and this test
        // passes without ever exercising the isFetching guard it names.
        config: { publish_mode: 'editorial_workflow' },
        collections: fromJS({}),
        editorialWorkflow: fromJS({ pages: { isFetching: true } }),
      });

      currentBackend.mockReturnValue(backend);
      store.dispatch(actions.loadUnpublishedEntries(store.getState().collections));

      expect(backend.unpublishedEntries).not.toHaveBeenCalled();
      expect(store.getActions()).toHaveLength(0);
    });

    it('records a failed load so the collection view can stop retrying', async () => {
      const { currentBackend } = require('../../backend');
      const error = new Error('API_ERROR: 403');
      const backend = { unpublishedEntries: jest.fn().mockRejectedValue(error) };
      const store = mockStore({
        config: { publish_mode: 'editorial_workflow' },
        collections: fromJS({}),
        editorialWorkflow: fromJS({ pages: {} }),
      });

      currentBackend.mockReturnValue(backend);
      store.dispatch(actions.loadUnpublishedEntries(store.getState().collections));
      await new Promise(resolve => setTimeout(resolve, 0));

      const types = store.getActions().map(action => action.type);
      expect(types[0]).toBe('UNPUBLISHED_ENTRIES_REQUEST');
      expect(types).toContain('UNPUBLISHED_ENTRIES_FAILURE');
      expect(store.getActions().find(a => a.type === 'UNPUBLISHED_ENTRIES_FAILURE').payload).toBe(
        error,
      );
    });

    // The guard against retrying lives in the collection view, not here: an
    // explicit load, such as opening the Workflow page, must still go out after
    // a failure, or one 403 would hide the board for the rest of the session.
    it('still loads when asked explicitly after a failure', () => {
      const { currentBackend } = require('../../backend');
      const backend = {
        unpublishedEntries: jest.fn().mockResolvedValue({ entries: [], pagination: 0 }),
      };
      const store = mockStore({
        config: { publish_mode: 'editorial_workflow' },
        collections: fromJS({}),
        editorialWorkflow: fromJS({ pages: { isFetching: false, error: 'API_ERROR: 403' } }),
      });

      currentBackend.mockReturnValue(backend);
      store.dispatch(actions.loadUnpublishedEntries(store.getState().collections));

      expect(backend.unpublishedEntries).toHaveBeenCalledTimes(1);
    });
  });

  describe('publishUnpublishedEntry', () => {
    it('should publish unpublished entry and report success', async () => {
      const { currentBackend } = require('../../backend');

      const entry = {};
      const backend = {
        publishUnpublishedEntry: jest.fn().mockResolvedValue(),
        getEntry: jest.fn().mockResolvedValue(entry),
        getMedia: jest.fn().mockResolvedValue([]),
        getNotes: jest.fn().mockResolvedValue([]),
      };

      const store = mockStore({
        config: fromJS({}),
        integrations: fromJS([]),
        mediaLibrary: fromJS({
          isLoading: false,
        }),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
      });

      currentBackend.mockReturnValue(backend);

      const slug = 'slug';

      return store.dispatch(actions.publishUnpublishedEntry('posts', slug)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(8);

        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual({
          type: 'MEDIA_LOAD_REQUEST',
          payload: {
            page: 1,
          },
        });
        expect(actions[2]).toEqual({
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.entryPublished' },
            type: 'success',
            dismissAfter: 4000,
          },
        });
        expect(actions[3]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS',
          payload: {
            collection: 'posts',
            slug,
          },
        });

        expect(actions[4]).toEqual({
          type: 'MEDIA_LOAD_SUCCESS',
          payload: {
            files: [],
          },
        });
        expect(actions[5]).toEqual({
          type: 'ENTRY_REQUEST',
          payload: {
            slug,
            collection: 'posts',
          },
        });
        expect(actions[6]).toEqual({
          type: 'ENTRY_SUCCESS',
          payload: {
            entry,
            collection: 'posts',
          },
        });
        expect(actions[7]).toEqual({
          type: 'DRAFT_CREATE_FROM_ENTRY',
          payload: {
            entry,
          },
        });
      });
    });

    it('should publish unpublished entry and report error', () => {
      const { currentBackend } = require('../../backend');

      const error = new Error('failed to publish entry');
      const backend = {
        publishUnpublishedEntry: jest.fn().mockRejectedValue(error),
      };

      const store = mockStore({
        config: fromJS({}),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
      });

      currentBackend.mockReturnValue(backend);

      const slug = 'slug';

      return store.dispatch(actions.publishUnpublishedEntry('posts', slug)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(3);
        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual({
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.onFailToPublishEntry', details: error },
            type: 'error',
            dismissAfter: 8000,
          },
        });
        expect(actions[2]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE',
          payload: {
            collection: 'posts',
            slug,
          },
        });
      });
    });
  });
});
