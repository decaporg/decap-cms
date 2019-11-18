import { fromJS, List, Map } from 'immutable';
import {
  createEmptyDraftData,
  retrieveLocalBackup,
  persistLocalBackup,
  getMediaAssets,
  discardDraft,
  loadLocalBackup,
} from '../entries';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

jest.mock('coreSrc/backend');
jest.mock('Reducers', () => {
  return {
    getAsset: jest.fn().mockReturnValue({}),
  };
});
jest.mock('ValueObjects/AssetProxy');
jest.mock('netlify-cms-lib-util');
jest.mock('../mediaLibrary.js');

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

  describe('discardDraft', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete media files on discard draft', () => {
      const { deleteMedia } = require('../mediaLibrary');
      const mediaFiles = [{ draft: false }, { draft: true }];

      deleteMedia.mockImplementation(file => ({ type: 'DELETE_MEDIA', payload: file }));

      const store = mockStore({
        config: Map(),
        entryDraft: Map({
          mediaFiles: List(mediaFiles),
        }),
      });

      store.dispatch(discardDraft());

      const actions = store.getActions();

      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ type: 'DELETE_MEDIA', payload: { draft: true } });
      expect(actions[1]).toEqual({ type: 'DRAFT_DISCARD' });
    });
  });

  describe('persistLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should persist local backup with media files', () => {
      const getState = jest.fn();
      const { currentBackend } = require('coreSrc/backend');
      const { getAsset } = require('Reducers');

      const backend = {
        persistLocalDraftBackup: jest.fn((...args) => args),
      };

      const state = { config: {} };

      currentBackend.mockReturnValue(backend);
      getAsset.mockImplementation((state, path) => path);
      getState.mockReturnValue(state);

      const entry = Map();
      const collection = Map();
      const mediaFiles = [{ public_path: '/static/media/image.png' }];

      const result = persistLocalBackup(entry, collection, mediaFiles)(null, getState);

      expect(result).toEqual([entry, collection, mediaFiles, ['/static/media/image.png']]);
    });
  });

  describe('retrieveLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should retrieve media files with local backup', () => {
      const { currentBackend } = require('coreSrc/backend');
      const { createAssetProxy } = require('ValueObjects/AssetProxy');
      const { addMediaFilesToLibrary } = require('../mediaLibrary');

      addMediaFilesToLibrary.mockImplementation(mediaFiles => ({
        type: 'ADD_MEDIA_FILES_TO_LIBRARY',
        payload: { mediaFiles },
      }));

      const backend = {
        getLocalDraftBackup: jest.fn((...args) => args),
      };

      const store = mockStore({
        config: Map(),
      });

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockImplementation((value, fileObj) => ({ value, fileObj }));

      const collection = Map({
        name: 'collection',
      });
      const slug = 'slug';

      const entry = {};
      const mediaFiles = [{ public_path: '/static/media/image.png' }];
      const assets = [{ value: 'image.png', fileObj: {} }];

      backend.getLocalDraftBackup.mockReturnValue({ entry, mediaFiles, assets });

      return store.dispatch(retrieveLocalBackup(collection, slug)).then(() => {
        const actions = store.getActions();

        expect(createAssetProxy).toHaveBeenCalledTimes(1);
        expect(createAssetProxy).toHaveBeenCalledWith(assets[0].value, assets[0].fileObj);
        expect(actions).toHaveLength(2);

        expect(actions[0]).toEqual({
          type: 'ADD_ASSETS',
          payload: [{ value: 'image.png', fileObj: {} }],
        });
        expect(actions[1]).toEqual({
          type: 'DRAFT_LOCAL_BACKUP_RETRIEVED',
          payload: { entry, mediaFiles },
        });
      });
    });
  });

  describe('loadLocalBackup', () => {
    it('should add backup media files to media library', () => {
      const store = mockStore({
        config: Map(),
        entryDraft: Map({
          mediaFiles: List([{ path: 'static/media.image.png' }]),
        }),
        mediaLibrary: Map({
          isLoading: false,
        }),
      });

      store.dispatch(loadLocalBackup());

      const actions = store.getActions();

      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({
        type: 'DRAFT_CREATE_FROM_LOCAL_BACKUP',
      });
      expect(actions[1]).toEqual({
        type: 'ADD_MEDIA_FILES_TO_LIBRARY',
        payload: { mediaFiles: [{ path: 'static/media.image.png', draft: true }] },
      });
    });
  });

  describe('getMediaAssets', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should map mediaFiles to assets', () => {
      const { getAsset } = require('Reducers');
      const state = {};
      const mediaFiles = [{ public_path: 'public_path' }];

      const asset = { name: 'asset1' };

      getAsset.mockReturnValue(asset);

      expect(getMediaAssets(state, mediaFiles)).toEqual([asset]);

      expect(getAsset).toHaveBeenCalledTimes(1);
      expect(getAsset).toHaveBeenCalledWith(state, 'public_path');
    });
  });
});
