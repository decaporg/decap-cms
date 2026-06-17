import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { List, Map } from 'immutable';

import { insertMedia, persistMedia, deleteMedia } from '../mediaLibrary';

jest.mock('../../backend');
jest.mock('../waitUntil');
jest.mock('../../integrations', () => ({
  getIntegrationProvider: jest.fn(),
}));
jest.mock('../../lib/imageTransformations', () => {
  const actual = jest.requireActual('../../lib/imageTransformations');
  return {
    ...actual,
    transformImage: jest.fn(),
  };
});
jest.mock('decap-cms-lib-util', () => {
  const lib = jest.requireActual('decap-cms-lib-util');
  return {
    ...lib,
    getBlobSHA: jest.fn(),
  };
});

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mediaLibrary', () => {
  describe('insertMedia', () => {
    it('should return mediaPath as string when string is given', () => {
      const store = mockStore({
        config: {
          public_folder: '/media',
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false, collection: 'posts' }),
        }),
      });

      store.dispatch(insertMedia('foo.png'));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '/media/foo.png' },
      });
    });

    it('should return mediaPath as array of strings when array of strings is given', () => {
      const store = mockStore({
        config: {
          public_folder: '/media',
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false, collection: 'posts' }),
        }),
      });

      store.dispatch(insertMedia(['foo.png']));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: ['/media/foo.png'] },
      });
    });
  });

  const { currentBackend } = require('../../backend');

  const backend = {
    persistMedia: jest.fn(() => ({ id: 'id' })),
    deleteMedia: jest.fn(),
  };

  currentBackend.mockReturnValue(backend);

  describe('persistMedia', () => {
    global.URL = { createObjectURL: jest.fn().mockReturnValue('displayURL') };

    beforeEach(() => {
      jest.clearAllMocks();
      window.confirm = jest.fn(() => true);
    });

    it('should not persist media when editing draft', () => {
      const { getBlobSHA } = require('decap-cms-lib-util');

      getBlobSHA.mockReturnValue('000000000000000');

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false, collection: 'posts' }),
        }),
      });

      const file = new File([''], 'name.png');

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(2);
        expect(actions[0].type).toEqual('ADD_ASSET');
        expect(actions[0].payload).toEqual(
          expect.objectContaining({
            path: 'static/media/name.png',
          }),
        );
        expect(actions[1].type).toEqual('ADD_DRAFT_ENTRY_MEDIA_FILE');
        expect(actions[1].payload).toEqual(
          expect.objectContaining({
            draft: true,
            id: '000000000000000',
            path: 'static/media/name.png',
            size: file.size,
            name: file.name,
          }),
        );

        expect(getBlobSHA).toHaveBeenCalledTimes(1);
        expect(getBlobSHA).toHaveBeenCalledWith(file);
        expect(backend.persistMedia).toHaveBeenCalledTimes(0);
      });
    });

    it('should persist media when not editing draft', () => {
      const store = mockStore({
        config: {
          media_folder: 'static/media',
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        integrations: Map(),
        mediaLibrary: Map({
          files: List([{ name: 'kittens.jpg' }]),
        }),
        entryDraft: Map({
          entry: Map(),
        }),
      });

      const file = new File([''], 'name.png');

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(3);

        expect(actions).toHaveLength(3);
        expect(actions[0]).toEqual({ type: 'MEDIA_PERSIST_REQUEST' });
        expect(actions[1].type).toEqual('ADD_ASSET');
        expect(actions[1].payload).toEqual(
          expect.objectContaining({
            path: 'static/media/name.png',
          }),
        );
        expect(actions[2]).toEqual({
          type: 'MEDIA_PERSIST_SUCCESS',
          payload: {
            file: { id: 'id' },
          },
        });

        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          expect.objectContaining({
            path: 'static/media/name.png',
          }),
        );
      });
    });

    it('should sanitize media name if needed when persisting', () => {
      const store = mockStore({
        config: {
          media_folder: 'static/media',
          slug: {
            encoding: 'ascii',
            clean_accents: true,
            sanitize_replacement: '_',
          },
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map(),
        }),
      });

      const file = new File([''], 'abc DEF éâçÖ $;, .png');

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(3);

        expect(actions[0]).toEqual({ type: 'MEDIA_PERSIST_REQUEST' });

        expect(actions[1].type).toEqual('ADD_ASSET');
        expect(actions[1].payload).toEqual(
          expect.objectContaining({
            path: 'static/media/abc_def_eaco_.png',
          }),
        );

        expect(actions[2]).toEqual({
          type: 'MEDIA_PERSIST_SUCCESS',
          payload: {
            file: { id: 'id' },
          },
        });

        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          expect.objectContaining({
            path: 'static/media/abc_def_eaco_.png',
          }),
        );
      });
    });

    it('should persist a processed image as the selected media', () => {
      const { transformImage } = require('../../lib/imageTransformations');
      backend.persistMedia.mockImplementation((_config, assetProxy) => ({
        id: assetProxy.path,
        path: assetProxy.path,
      }));

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          media_processing: {
            enabled: true,
            format: { enabled: true, default: 'webp' },
            quality: 80,
            strip_metadata: true,
            width: 400,
            height: null,
            aspect_ratio: '16_9',
          },
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map(),
        }),
      });

      const file = new File(['original'], 'kittens.jpg', { type: 'image/jpeg' });
      const processed = new File(['processed'], 'kittens.webp', { type: 'image/webp' });

      transformImage.mockResolvedValue([{ file: processed, path: 'static/media/kittens.webp' }]);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();
        const addAssetActions = actions.filter(action => action.type === 'ADD_ASSET');
        const persistedActions = actions.filter(action => action.type === 'MEDIA_PERSIST_SUCCESS');

        expect(transformImage).toHaveBeenCalledWith(file, 'static/media/kittens.jpg', {
          format: 'webp',
          quality: 0.8,
          width: 400,
          height: null,
          aspectRatio: 16 / 9,
        });
        expect(addAssetActions.map(action => action.payload.path)).toEqual([
          'static/media/kittens.webp',
        ]);
        expect(persistedActions.map(action => action.payload.file.path)).toEqual([
          'static/media/kittens.webp',
        ]);
      });
    });

    it('should confirm before replacing the original output file when format conversion is disabled', () => {
      const { transformImage } = require('../../lib/imageTransformations');
      backend.persistMedia.mockImplementation((_config, assetProxy) => ({
        id: assetProxy.path,
        path: assetProxy.path,
      }));

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          media_processing: {
            enabled: true,
            format: { enabled: false, default: 'webp' },
          },
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        integrations: Map(),
        mediaLibrary: Map({
          files: List([{ name: 'kittens.jpg', path: 'static/media/kittens.jpg' }]),
        }),
        entryDraft: Map({
          entry: Map(),
        }),
      });

      const file = new File(['original'], 'kittens.jpg', { type: 'image/jpeg' });
      const processed = new File(['processed'], 'kittens.jpg', { type: 'image/jpeg' });

      transformImage.mockResolvedValue([{ file: processed, path: 'static/media/kittens.jpg' }]);

      return store.dispatch(persistMedia(file)).then(() => {
        const addAssetActions = store.getActions().filter(action => action.type === 'ADD_ASSET');

        expect(transformImage).toHaveBeenCalledWith(file, 'static/media/kittens.jpg', {
          format: undefined,
          quality: undefined,
          width: null,
          height: null,
          aspectRatio: null,
        });
        expect(addAssetActions.map(action => action.payload.path)).toEqual([
          'static/media/kittens.jpg',
        ]);
        expect(window.confirm).toHaveBeenCalledWith(
          'kittens.jpg already exists. Do you want to replace it?',
        );
        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
      });
    });

    it('should upload a processed image when an asset store integration is configured', () => {
      const { transformImage } = require('../../lib/imageTransformations');
      const { getBlobSHA } = require('decap-cms-lib-util');
      const { getIntegrationProvider } = require('../../integrations');
      const upload = jest.fn(() =>
        Promise.resolve({ asset: { url: 'https://assets.example.com/kittens.webp' } }),
      );

      getBlobSHA.mockReturnValue('000000000000001');
      getIntegrationProvider.mockReturnValue({ upload });

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          media_processing: {
            enabled: true,
            format: { enabled: true, default: 'webp' },
            quality: 80,
            strip_metadata: true,
            width: 400,
            height: null,
            aspect_ratio: '16_9',
          },
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
        },
        collections: Map({
          posts: Map({ name: 'posts' }),
        }),
        integrations: Map({
          hooks: Map({ assetStore: 'assetStore' }),
          providers: Map({ assetStore: Map() }),
        }),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map(),
        }),
      });

      const file = new File(['original'], 'kittens.jpg', { type: 'image/jpeg' });
      const processed = new File(['processed'], 'kittens.webp', { type: 'image/webp' });

      transformImage.mockResolvedValue([{ file: processed, path: 'kittens.webp' }]);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(transformImage).toHaveBeenCalledWith(file, 'kittens.jpg', {
          format: 'webp',
          quality: 0.8,
          width: 400,
          height: null,
          aspectRatio: 16 / 9,
        });
        expect(upload).toHaveBeenCalledWith(processed, undefined);
        expect(getBlobSHA).toHaveBeenCalledWith(processed);
        expect(actions).toContainEqual({
          type: 'MEDIA_PERSIST_SUCCESS',
          payload: {
            file: expect.objectContaining({
              id: '000000000000001',
              name: 'kittens.webp',
              url: 'https://assets.example.com/kittens.webp',
              path: 'https://assets.example.com/kittens.webp',
              file: processed,
              size: processed.size,
            }),
            privateUpload: undefined,
          },
        });
      });
    });
  });

  describe('deleteMedia', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete non draft file', () => {
      const store = mockStore({
        config: {
          publish_mode: 'editorial_workflow',
        },
        collections: Map(),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false }),
        }),
      });

      const file = { name: 'name.png', id: 'id', path: 'static/media/name.png', draft: false };

      return store.dispatch(deleteMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(4);
        expect(actions[0]).toEqual({ type: 'MEDIA_DELETE_REQUEST' });
        expect(actions[1]).toEqual({
          type: 'REMOVE_ASSET',
          payload: 'static/media/name.png',
        });
        expect(actions[2]).toEqual({
          type: 'MEDIA_DELETE_SUCCESS',
          payload: { file },
        });
        expect(actions[3]).toEqual({
          type: 'REMOVE_DRAFT_ENTRY_MEDIA_FILE',
          payload: { id: 'id' },
        });

        expect(backend.deleteMedia).toHaveBeenCalledTimes(1);
        expect(backend.deleteMedia).toHaveBeenCalledWith(
          store.getState().config,
          'static/media/name.png',
        );
      });
    });

    it('should not delete a draft file', () => {
      const store = mockStore({
        config: {
          publish_mode: 'editorial_workflow',
        },
        collections: Map(),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false }),
        }),
      });

      const file = { name: 'name.png', id: 'id', path: 'static/media/name.png', draft: true };

      return store.dispatch(deleteMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(2);
        expect(actions[0]).toEqual({
          type: 'REMOVE_ASSET',
          payload: 'static/media/name.png',
        });

        expect(actions[1]).toEqual({
          type: 'REMOVE_DRAFT_ENTRY_MEDIA_FILE',
          payload: { id: 'id' },
        });

        expect(backend.deleteMedia).toHaveBeenCalledTimes(0);
      });
    });
  });
});
