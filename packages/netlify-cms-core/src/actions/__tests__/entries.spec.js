import { fromJS, Map } from 'immutable';
import {
  createEmptyDraftData,
  retrieveLocalBackup,
  persistLocalBackup,
  getMediaAssets,
} from '../entries';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

jest.mock('coreSrc/backend');
jest.mock('../media', () => {
  const media = jest.requireActual('../media');
  return {
    ...media,
    getAsset: jest.fn(),
  };
});
jest.mock('netlify-cms-lib-util');
jest.mock('../mediaLibrary');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('entries', () => {
  describe('createEmptyDraftData', () => {
    it('should set default value for list field widget', () => {
      const fields = fromJS([
        {
          name: 'images',
          widget: 'list',
          field: { name: 'url', widget: 'text', default: 'https://image.png' },
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({ images: ['https://image.png'] });
    });

    it('should set default values for list fields widget', () => {
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
  });

  describe('persistLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should persist local backup with media files', () => {
      const { currentBackend } = require('coreSrc/backend');

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
      const { currentBackend } = require('coreSrc/backend');
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

    it('should map mediaFiles to assets', async () => {
      const { getAsset } = require('../media');
      const mediaFiles = fromJS([{ path: 'path1' }, { path: 'path2', draft: true }]);

      const asset = { path: 'path1' };

      getAsset.mockReturnValue(() => asset);

      const collection = Map();
      const entry = Map({ mediaFiles });
      await expect(getMediaAssets({ entry, collection })).resolves.toEqual([asset]);

      expect(getAsset).toHaveBeenCalledTimes(1);
      expect(getAsset).toHaveBeenCalledWith({ collection, path: 'path2', entry });
    });
  });
});
