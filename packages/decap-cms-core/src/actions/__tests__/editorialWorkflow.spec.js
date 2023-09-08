import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';

import { addAssets } from '../media';
import * as actions from '../editorialWorkflow';

jest.mock('../../backend');
jest.mock('../../valueObjects/AssetProxy');
jest.mock('decap-cms-lib-util');
jest.mock('uuid', () => {
  return { v4: jest.fn().mockReturnValue('000000000000000000000') };
});

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('editorialWorkflow actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        config: fromJS({}),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
        mediaLibrary: fromJS({
          isLoading: false,
        }),
        editorialWorkflow: fromJS({
          pages: { ids: [] },
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
  });

  describe('publishUnpublishedEntry', () => {
    it('should publish unpublished entry and report success', () => {
      const { currentBackend } = require('../../backend');

      const entry = {};
      const backend = {
        publishUnpublishedEntry: jest.fn().mockResolvedValue(),
        getEntry: jest.fn().mockResolvedValue(entry),
        getMedia: jest.fn().mockResolvedValue([]),
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
