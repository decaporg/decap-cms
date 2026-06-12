import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { List, Map } from 'immutable';

import { insertMedia, persistMedia, deleteMedia } from '../mediaLibrary';

jest.mock('../../backend');
jest.mock('../waitUntil');
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

    it('should persist image transformations and select default transformation', () => {
      const { transformImage } = require('../../lib/imageTransformations');
      backend.persistMedia.mockImplementation((_config, assetProxy) => ({
        id: assetProxy.path,
        path: assetProxy.path,
      }));

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          image_transformations: {
            keep_original: true,
            variants: [
              { name: 'small', width: 100 },
              { name: 'medium', width: 400, default: true },
            ],
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
      const small = new File(['small'], 'kittens.jpg', { type: 'image/jpeg' });
      const medium = new File(['medium'], 'kittens.jpg', { type: 'image/jpeg' });

      transformImage.mockResolvedValue([
        { file, path: 'static/media/kittens.jpg', original: true },
        { file: small, path: 'static/media/_transformations/small/kittens.jpg' },
        { file: medium, path: 'static/media/_transformations/medium/kittens.jpg', default: true },
      ]);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();
        const addAssetActions = actions.filter(action => action.type === 'ADD_ASSET');
        const persistedActions = actions.filter(action => action.type === 'MEDIA_PERSIST_SUCCESS');

        expect(transformImage).toHaveBeenCalledWith(file, 'static/media/kittens.jpg', {
          keepOriginal: true,
          variants: [
            { name: 'small', width: 100 },
            { name: 'medium', width: 400, default: true },
          ],
        });
        expect(addAssetActions.map(action => action.payload.path)).toEqual([
          'static/media/kittens.jpg',
          'static/media/_transformations/small/kittens.jpg',
          'static/media/_transformations/medium/kittens.jpg',
        ]);
        expect(persistedActions.map(action => action.payload.file.path)).toEqual([
          'static/media/kittens.jpg',
          'static/media/_transformations/small/kittens.jpg',
          'static/media/_transformations/medium/kittens.jpg',
        ]);
        expect(persistedActions[persistedActions.length - 1].payload.file.path).toBe(
          'static/media/_transformations/medium/kittens.jpg',
        );
      });
    });

    it('should skip the original image when keep_original is false', () => {
      const { transformImage } = require('../../lib/imageTransformations');
      backend.persistMedia.mockImplementation((_config, assetProxy) => ({
        id: assetProxy.path,
        path: assetProxy.path,
      }));

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          image_transformations: {
            keep_original: false,
            variants: [{ name: 'compressed', quality: 70, keep_original_size: true }],
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
      const compressed = new File(['compressed'], 'kittens.jpg', { type: 'image/jpeg' });

      transformImage.mockResolvedValue([
        { file: compressed, path: 'static/media/_transformations/compressed/kittens.jpg' },
      ]);

      return store.dispatch(persistMedia(file)).then(() => {
        const addAssetActions = store.getActions().filter(action => action.type === 'ADD_ASSET');

        expect(transformImage).toHaveBeenCalledWith(file, 'static/media/kittens.jpg', {
          keepOriginal: false,
          variants: [{ name: 'compressed', quality: 70, keep_original_size: true }],
        });
        expect(addAssetActions.map(action => action.payload.path)).toEqual([
          'static/media/_transformations/compressed/kittens.jpg',
        ]);
        expect(window.confirm).not.toHaveBeenCalled();
        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
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
