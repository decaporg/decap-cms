import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as actions from '@/core/actions/editorialWorkflow';
import { addAssets } from '@/core/actions/media';
import * as backendModule from '@/core/backend';
import * as assetProxyModule from '@/core/valueObjects/AssetProxy';

vi.mock('../../backend');
vi.mock('../../valueObjects/AssetProxy');
vi.mock('decap-cms-lib-util');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('editorialWorkflow actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  describe('loadUnpublishedEntry', () => {
    it('should load unpublished entry', () => {
      const currentBackend = vi.mocked(backendModule.currentBackend);
      const createAssetProxy = vi.mocked(assetProxyModule.createAssetProxy);

      const assetProxy = { name: 'name', path: 'path' };
      const entry = { mediaFiles: [{ file: { name: 'name' }, id: '1', draft: true }] };
      const backend = {
        unpublishedEntry: vi.fn().mockResolvedValue(entry),
      };

      const store = mockStore({
        config: {},
        collections: {
          posts: { name: 'posts' },
        },
        mediaLibrary: {
          isLoading: false,
        },
        editorialWorkflow: {
          pages: { ids: [] },
        },
      });

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockResolvedValue(assetProxy);

      const slug = 'slug';
      const collection = store.getState().collections.posts;

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
  });

  describe('persistUnpublishedEntry - missing required field notification (DCMS-2151)', () => {
    const collection = { name: 'posts' };

    function makeState(fieldsErrors: Record<string, unknown>) {
      return {
        config: {},
        collections: { posts: collection },
        entries: { pages: { posts: { ids: [] } } },
        editorialWorkflow: { entities: {}, pages: { ids: ['loaded'] } },
        entryDraft: {
          fieldsErrors,
          entry: { slug: 'post-c', data: {}, mediaFiles: [] },
        },
      };
    }

    beforeEach(() => {
      vi.clearAllMocks();
      const currentBackend = vi.mocked(backendModule.currentBackend);
      currentBackend.mockReturnValue({ persistEntry: vi.fn() } as never);
    });

    it('uses smart_count 1 when a single required field is missing', async () => {
      const store = mockStore(
        makeState({
          title: [{ type: 'PRESENCE', message: 'Title is required' }],
        }),
      );

      await expect(
        store.dispatch(actions.persistUnpublishedEntry(collection as never, false) as never),
      ).rejects.toBeUndefined();

      const dispatched = store.getActions();
      const notification = dispatched.find((action: any) => action.type === 'NOTIFICATION_SEND');
      expect(notification.payload.message).toEqual({
        key: 'ui.toast.missingRequiredField',
        smart_count: 1,
      });
    });

    it('uses smart_count matching the number of missing required fields when 2+ are missing', async () => {
      const store = mockStore(
        makeState({
          title: [{ type: 'PRESENCE', message: 'Title is required' }],
          summary: [{ type: 'PRESENCE', message: 'Summary is required' }],
        }),
      );

      await expect(
        store.dispatch(actions.persistUnpublishedEntry(collection as never, false) as never),
      ).rejects.toBeUndefined();

      const dispatched = store.getActions();
      const notification = dispatched.find((action: any) => action.type === 'NOTIFICATION_SEND');
      expect(notification.payload.message).toEqual({
        key: 'ui.toast.missingRequiredField',
        smart_count: 2,
      });
    });
  });

  describe('publishUnpublishedEntry', () => {
    it('should publish unpublished entry and report success', () => {
      const currentBackend = vi.mocked(backendModule.currentBackend);

      const entry = {};
      const backend = {
        publishUnpublishedEntry: vi.fn().mockResolvedValue(undefined),
        getEntry: vi.fn().mockResolvedValue(entry),
        getMedia: vi.fn().mockResolvedValue([]),
      };

      const store = mockStore({
        config: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          isLoading: false,
        },
        collections: {
          posts: { name: 'posts' },
        },
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
      const currentBackend = vi.mocked(backendModule.currentBackend);

      const error = new Error('failed to publish entry');
      const backend = {
        publishUnpublishedEntry: vi.fn().mockRejectedValue(error),
      };

      const store = mockStore({
        config: {},
        collections: {
          posts: { name: 'posts' },
        },
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

  describe('scheduleUnpublishedEntryPublish', () => {
    it('stores the schedule and reports success for a valid future date', () => {
      const store = mockStore({});
      const slug = 'my-post';
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      store.dispatch(actions.scheduleUnpublishedEntryPublish('posts', slug, future) as any);

      const dispatched = store.getActions();
      expect(dispatched).toEqual([
        {
          type: 'UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS',
          payload: { collection: 'posts', slug, publishAt: future },
        },
        {
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.entryScheduled' },
            type: 'success',
            dismissAfter: 4000,
          },
        },
      ]);
    });

    it('rejects a date in the past without storing anything', () => {
      const store = mockStore({});
      const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      store.dispatch(actions.scheduleUnpublishedEntryPublish('posts', 'my-post', past) as any);

      expect(store.getActions()).toEqual([
        {
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.invalidScheduleDate' },
            type: 'error',
            dismissAfter: 8000,
          },
        },
      ]);
    });

    it('rejects an unparseable date string', () => {
      const store = mockStore({});

      store.dispatch(
        actions.scheduleUnpublishedEntryPublish('posts', 'my-post', 'not-a-date') as any,
      );

      expect(store.getActions()).toEqual([
        {
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.invalidScheduleDate' },
            type: 'error',
            dismissAfter: 8000,
          },
        },
      ]);
    });
  });

  describe('unscheduleUnpublishedEntryPublish', () => {
    it('clears the schedule and reports success', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const setupStore = mockStore({});
      setupStore.dispatch(
        actions.scheduleUnpublishedEntryPublish('posts', 'my-post', future) as any,
      );

      const store = mockStore({});
      store.dispatch(actions.unscheduleUnpublishedEntryPublish('posts', 'my-post') as any);

      expect(store.getActions()).toEqual([
        {
          type: 'UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS',
          payload: { collection: 'posts', slug: 'my-post' },
        },
        {
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.entryUnscheduled' },
            type: 'success',
            dismissAfter: 4000,
          },
        },
      ]);
    });
  });

  describe('checkScheduledPublishes', () => {
    it('publishes a "Ready" entry whose scheduled time is due', async () => {
      const currentBackend = vi.mocked(backendModule.currentBackend);
      const backend = {
        publishUnpublishedEntry: vi.fn().mockResolvedValue(undefined),
        getEntry: vi.fn().mockResolvedValue({}),
        getMedia: vi.fn().mockResolvedValue([]),
      };
      currentBackend.mockReturnValue(backend);

      const store = mockStore({
        config: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: { isLoading: false },
        collections: { posts: { name: 'posts' } },
        editorialWorkflow: {
          entities: {
            'posts.due-post': {
              collection: 'posts',
              slug: 'due-post',
              status: 'pending_publish',
              publishAt: new Date(Date.now() - 1000).toISOString(),
            },
          },
        },
      });

      await store.dispatch(actions.checkScheduledPublishes() as any);

      expect(backend.publishUnpublishedEntry).toHaveBeenCalledTimes(1);
      const dispatched = store.getActions();
      expect(dispatched[0]).toEqual({
        type: 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST',
        payload: { collection: 'posts', slug: 'due-post' },
      });
    });

    it('does not publish an entry whose scheduled time is in the future', () => {
      const currentBackend = vi.mocked(backendModule.currentBackend);
      const backend = { publishUnpublishedEntry: vi.fn() };
      currentBackend.mockReturnValue(backend);

      const store = mockStore({
        config: {},
        collections: { posts: { name: 'posts' } },
        editorialWorkflow: {
          entities: {
            'posts.future-post': {
              collection: 'posts',
              slug: 'future-post',
              status: 'pending_publish',
              publishAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
          },
        },
      });

      store.dispatch(actions.checkScheduledPublishes() as any);

      expect(backend.publishUnpublishedEntry).not.toHaveBeenCalled();
      expect(store.getActions()).toEqual([]);
    });

    it('does not publish a due entry that is not in "Ready" status', () => {
      const currentBackend = vi.mocked(backendModule.currentBackend);
      const backend = { publishUnpublishedEntry: vi.fn() };
      currentBackend.mockReturnValue(backend);

      const store = mockStore({
        config: {},
        collections: { posts: { name: 'posts' } },
        editorialWorkflow: {
          entities: {
            'posts.draft-post': {
              collection: 'posts',
              slug: 'draft-post',
              status: 'draft',
              publishAt: new Date(Date.now() - 1000).toISOString(),
            },
          },
        },
      });

      store.dispatch(actions.checkScheduledPublishes() as any);

      expect(backend.publishUnpublishedEntry).not.toHaveBeenCalled();
      expect(store.getActions()).toEqual([]);
    });

    it('does not double-publish an entry that is already publishing', () => {
      const currentBackend = vi.mocked(backendModule.currentBackend);
      const backend = { publishUnpublishedEntry: vi.fn() };
      currentBackend.mockReturnValue(backend);

      const store = mockStore({
        config: {},
        collections: { posts: { name: 'posts' } },
        editorialWorkflow: {
          entities: {
            'posts.in-flight': {
              collection: 'posts',
              slug: 'in-flight',
              status: 'pending_publish',
              isPublishing: true,
              publishAt: new Date(Date.now() - 1000).toISOString(),
            },
          },
        },
      });

      store.dispatch(actions.checkScheduledPublishes() as any);

      expect(backend.publishUnpublishedEntry).not.toHaveBeenCalled();
      expect(store.getActions()).toEqual([]);
    });

    it('is a no-op when there are no unpublished entities', () => {
      const store = mockStore({ editorialWorkflow: {} });
      expect(() => store.dispatch(actions.checkScheduledPublishes() as any)).not.toThrow();
      expect(store.getActions()).toEqual([]);
    });
  });

  // decaporg #7563: an entry's notes thread is closed on publish and
  // reopened when the entry is unpublished.
  describe('unpublishPublishedEntry', () => {
    function setup(reopen: () => Promise<void>) {
      const currentBackend = vi.mocked(backendModule.currentBackend);
      const backend = {
        deleteEntry: vi.fn().mockResolvedValue(undefined),
        persistEntry: vi.fn().mockResolvedValue(undefined),
        reopenIssueForUnpublishedEntry: vi.fn(reopen),
        unpublishedEntry: vi.fn().mockResolvedValue({ slug: 'slug', collection: 'posts', data: {} }),
      };
      currentBackend.mockReturnValue(backend as never);
      const store = mockStore({
        config: { publish_mode: 'editorial_workflow' },
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: { isLoading: false },
        collections: { posts: { name: 'posts' } },
        entries: { entities: { 'posts.slug': { slug: 'slug', data: {} } }, pages: {} },
        editorialWorkflow: { entities: {}, pages: {} },
        entryDraft: { entry: {} },
      });
      return { backend, store };
    }

    it('reopens the notes thread after unpublishing', async () => {
      const { backend, store } = setup(() => Promise.resolve());

      await store.dispatch(actions.unpublishPublishedEntry({ name: 'posts' } as never, 'slug') as never);

      expect(backend.reopenIssueForUnpublishedEntry).toHaveBeenCalledWith('posts', 'slug');
      expect(store.getActions().map(a => a.payload?.message?.key)).toContain('ui.toast.entryUnpublished');
    });

    it('still unpublishes when reopening the thread fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { store } = setup(() => Promise.reject(new Error('no issues access')));

      await store.dispatch(actions.unpublishPublishedEntry({ name: 'posts' } as never, 'slug') as never);

      expect(store.getActions().map(a => a.payload?.message?.key)).toContain('ui.toast.entryUnpublished');
    });
  });
});
