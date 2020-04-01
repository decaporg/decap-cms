import { fromJS, Map } from 'immutable';
import {
  createEmptyDraft,
  createEmptyDraftData,
  retrieveLocalBackup,
  persistLocalBackup,
  getMediaAssets,
} from '../entries';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AssetProxy from '../../valueObjects/AssetProxy';

jest.mock('coreSrc/backend');
jest.mock('netlify-cms-lib-util');
jest.mock('../mediaLibrary');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('entries', () => {
  describe('createEmptyDraft', () => {
    const { currentBackend } = require('coreSrc/backend');
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
            isModification: null,
            label: null,
            mediaFiles: [],
            metaData: null,
            partial: false,
            path: '',
            raw: '',
            slug: '',
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
            isModification: null,
            label: null,
            mediaFiles: [],
            metaData: null,
            partial: false,
            path: '',
            raw: '',
            slug: '',
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
              isModification: null,
              label: null,
              mediaFiles: [],
              metaData: null,
              partial: false,
              path: '',
              raw: '',
              slug: '',
              updatedOn: '',
            },
            type: 'DRAFT_CREATE_EMPTY',
          });
        });
    });
  });
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

    it('should map mediaFiles to assets', () => {
      const mediaFiles = fromJS([{ path: 'path1' }, { path: 'path2', draft: true }]);

      const entry = Map({ mediaFiles });
      expect(getMediaAssets({ entry })).toEqual([new AssetProxy({ path: 'path2' })]);
    });
  });
});
