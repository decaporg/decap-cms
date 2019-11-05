import { fromJS, List, Map } from 'immutable';
import {
  createEmptyDraftData,
  retrieveLocalBackup,
  persistLocalBackup,
  localBackupRetrieved,
  discardDraft,
  DRAFT_DISCARD,
} from '../entries';

jest.mock('coreSrc/backend');
jest.mock('Reducers', () => {
  return {
    getAsset: jest.fn().mockReturnValue({}),
  };
});
jest.mock('../mediaLibrary');
jest.mock('ValueObjects/AssetProxy');
jest.mock('../media');
jest.mock('netlify-cms-lib-util');

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
          fields: [{ name: 'title', widget: 'text' }, { name: 'url', widget: 'text' }],
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
          fields: [{ name: 'title', widget: 'text' }, { name: 'url', widget: 'text' }],
        },
      ]);
      expect(createEmptyDraftData(fields)).toEqual({});
    });
  });

  const dispatch = jest.fn();
  const getState = jest.fn();

  describe('discardDraft', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete media files on discard draft', () => {
      const { deleteMedia } = require('../mediaLibrary');

      deleteMedia.mockImplementation(file => file);

      const mediaFiles = [{ draft: false }, { draft: true }];
      const state = {
        config: {},
        entryDraft: Map({
          mediaFiles: List(mediaFiles),
        }),
      };

      getState.mockReturnValue(state);

      discardDraft()(dispatch, getState);

      expect(deleteMedia).toHaveBeenCalledTimes(1);
      expect(deleteMedia).toHaveBeenCalledWith(mediaFiles[1]);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith(mediaFiles[1]);
      expect(dispatch).toHaveBeenCalledWith({ type: DRAFT_DISCARD });
    });
  });

  describe('persistLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should persist local backup with media files', () => {
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

      const result = persistLocalBackup(entry, collection, mediaFiles)(dispatch, getState);

      expect(result).toEqual([entry, collection, mediaFiles, ['/static/media/image.png']]);
    });
  });

  describe('retrieveLocalBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should retrieve media files with local backup', async () => {
      const { currentBackend } = require('coreSrc/backend');
      const { createAssetProxy } = require('ValueObjects/AssetProxy');
      const { addAssets } = require('../media');

      const backend = {
        getLocalDraftBackup: jest.fn((...args) => args),
      };

      const state = { config: {} };

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockImplementation((value, fileObj) => ({ value, fileObj }));
      addAssets.mockImplementation(assets => assets);
      getState.mockReturnValue(state);

      const collection = Map({
        name: 'collection',
      });
      const slug = 'slug';

      const entry = {};
      const mediaFiles = [{ public_path: '/static/media/image.png' }];
      const assets = [{ value: 'image.png', fileObj: {} }];

      backend.getLocalDraftBackup.mockReturnValue({ entry, mediaFiles, assets });

      await retrieveLocalBackup(collection, slug)(dispatch, getState);

      expect(createAssetProxy).toHaveBeenCalledTimes(1);
      expect(createAssetProxy).toHaveBeenCalledWith(assets[0].value, assets[0].fileObj);
      expect(addAssets).toHaveBeenCalledTimes(1);
      expect(addAssets).toHaveBeenCalledWith(assets);
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith(assets);
      expect(dispatch).toHaveBeenCalledWith(localBackupRetrieved(entry, mediaFiles));
    });
  });
});
