import configureMockStore from 'redux-mock-store';
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
          // The entry has to actually be among the known workflow keys: a slug
          // absent from them is, by definition, not under editorial workflow,
          // and loadUnpublishedEntry now answers that from state instead of
          // spending a round trip asking the backend to confirm it. `loadedAt`
          // is what marks the set as backend-confirmed, so it is set here too —
          // without it the refresh runs and this test would pass only because
          // the missing mock threw into a swallowing catch.
          pages: { keys: ['posts/slug'], loadedAt: Date.now() },
          entities: { 'posts.slug': { collection: 'posts', slug: 'slug' } },
        }),
      });

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockResolvedValue(assetProxy);

      const slug = 'slug';
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, slug)).then(() => {
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

    it('loads the published entry without asking the backend when the loaded list does not contain the slug', () => {
      const { currentBackend } = require('../../backend');

      const backend = {
        unpublishedEntry: jest.fn(),
        unpublishedEntries: jest.fn(),
        unpublishedContentKeys: jest.fn(),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        entries: fromJS({}),
        editorialWorkflow: fromJS({
          // Known, FRESH, and this slug is not among the keys. Without
          // loadedAt the set counts as stale and the assertions below would
          // pass only because the refresh threw into a swallowing catch.
          pages: { keys: ['posts/other'], loadedAt: Date.now() },
          entities: { 'posts.other': { collection: 'posts', slug: 'other' } },
        }),
      });

      currentBackend.mockReturnValue(backend);

      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        // The open-pull-request set the backend would consult is the same one
        // the keys came from, so the request is pure latency.
        expect(backend.unpublishedEntry).not.toHaveBeenCalled();
        expect(backend.unpublishedEntries).not.toHaveBeenCalled();
        expect(backend.unpublishedContentKeys).not.toHaveBeenCalled();

        const dispatched = store.getActions();
        expect(dispatched[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_REDIRECT',
          payload: { collection: 'posts', slug: 'slug' },
        });
        expect(dispatched.map(a => a.type)).not.toContain('UNPUBLISHED_ENTRY_REQUEST');
      });
    });

    // These two cover the freshness window on `pages.loadedAt`. Without it the
    // key set is fetched once per page load and never again, so "this slug is
    // not in the set" — which the shortcut above treats as proof the entry is
    // not under editorial workflow — is answered from a snapshot that can be an
    // entire session old. A colleague's draft created in between then opens as
    // the published entry and saving it 422s on the existing cms/ branch.
    //
    // Both also pin WHICH call the refresh makes. `unpublishedEntries` answers
    // the same question but hydrates every draft it finds — a pull request
    // lookup, a diff and a blob read each — which measured 20 requests and
    // 3.1s through Turbo's proxy in front of an entry load that had not started
    // yet. Proving a slug absent needs identities only.
    //
    // Note redux-mock-store never runs reducers, so getState() cannot reflect
    // the refresh; what is asserted is that the refresh HAPPENS and that the
    // subsequent decision reads state. The two branches of that decision are
    // covered by the fresh-set test above and by the absent case below.
    it('refreshes a stale key set rather than trusting a session-old snapshot', () => {
      const { currentBackend } = require('../../backend');

      const draft = { collection: 'posts', slug: 'slug', mediaFiles: [] };
      const backend = {
        unpublishedContentKeys: jest.fn().mockResolvedValue(['posts/slug']),
        unpublishedEntries: jest.fn(),
        unpublishedEntry: jest.fn().mockResolvedValue(draft),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        entries: fromJS({}),
        editorialWorkflow: fromJS({
          // Confirmed at the start of a long-lived session, well past the
          // window.
          pages: { keys: ['posts/slug'], loadedAt: Date.now() - 10 * 60 * 1000 },
          entities: { 'posts.slug': { collection: 'posts', slug: 'slug' } },
        }),
      });

      currentBackend.mockReturnValue(backend);
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        expect(backend.unpublishedContentKeys).toHaveBeenCalled();
        // The keys, not the drafts behind them.
        expect(backend.unpublishedEntries).not.toHaveBeenCalled();

        const types = store.getActions().map(a => a.type);
        expect(types).toContain('UNPUBLISHED_KEYS_SUCCESS');
        // Known unpublished, so it opens through the workflow path.
        expect(types).toContain('UNPUBLISHED_ENTRY_REQUEST');
        expect(types).not.toContain('UNPUBLISHED_ENTRY_REDIRECT');
      });
    });

    it('still redirects to the published entry when a refreshed key set confirms the slug is absent', () => {
      const { currentBackend } = require('../../backend');

      const backend = {
        unpublishedContentKeys: jest.fn().mockResolvedValue([]),
        unpublishedEntries: jest.fn(),
        unpublishedEntry: jest.fn(),
      };

      const store = mockStore({
        config: fromJS({ editor: { notes: true } }),
        collections: fromJS({ posts: { name: 'posts' } }),
        mediaLibrary: fromJS({ isLoading: false }),
        entries: fromJS({}),
        editorialWorkflow: fromJS({
          pages: { keys: ['posts/other'], loadedAt: Date.now() - 10 * 60 * 1000 },
          entities: { 'posts.other': { collection: 'posts', slug: 'other' } },
        }),
      });

      currentBackend.mockReturnValue(backend);
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, 'slug')).then(() => {
        expect(backend.unpublishedContentKeys).toHaveBeenCalled();
        // One identity request, not a per-slug lookup and not a full hydration:
        // that is what keeps the optimisation this window protects.
        expect(backend.unpublishedEntry).not.toHaveBeenCalled();
        expect(backend.unpublishedEntries).not.toHaveBeenCalled();
        expect(store.getActions().map(a => a.type)).toContain('UNPUBLISHED_ENTRY_REDIRECT');
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
        config: fromJS({ publish_mode: 'editorial_workflow' }),
        collections: fromJS({}),
        editorialWorkflow: fromJS({ pages: { isFetching: true } }),
      });

      currentBackend.mockReturnValue(backend);
      store.dispatch(actions.loadUnpublishedEntries(store.getState().collections));

      expect(backend.unpublishedEntries).not.toHaveBeenCalled();
      expect(store.getActions()).toHaveLength(0);
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
