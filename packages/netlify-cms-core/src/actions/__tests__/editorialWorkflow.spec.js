import * as actions from '../editorialWorkflow';
import { addDraftEntryMediaFiles } from '../entries';
import { addAssets } from '../media';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';

jest.mock('coreSrc/backend');
jest.mock('Reducers', () => {
  return {
    getAsset: jest.fn().mockReturnValue({}),
  };
});
jest.mock('ValueObjects/AssetProxy');
jest.mock('netlify-cms-lib-util');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('editorialWorkflow actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadUnpublishedEntry', () => {
    it('should load unpublished entry', () => {
      const { currentBackend } = require('coreSrc/backend');
      const { createAssetProxy } = require('ValueObjects/AssetProxy');

      const assetProxy = { name: 'name', public_path: 'public_path' };
      const entry = { mediaFiles: [{ file: { name: 'name' }, id: '1' }] };
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
      });

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockResolvedValue(assetProxy);

      const slug = 'slug';
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, slug)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(5);
        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual(addAssets([assetProxy]));
        expect(actions[2]).toEqual(
          addDraftEntryMediaFiles([{ id: '1', draft: true, public_path: 'public_path' }]),
        );
        expect(actions[3]).toEqual({
          type: 'ADD_MEDIA_FILES_TO_LIBRARY',
          payload: {
            mediaFiles: [{ file: { name: 'name' }, id: '1', draft: true }],
          },
        });
        expect(actions[4]).toEqual({
          type: 'UNPUBLISHED_ENTRY_SUCCESS',
          payload: {
            collection: 'posts',
            entry,
          },
        });
      });
    });
  });
});
