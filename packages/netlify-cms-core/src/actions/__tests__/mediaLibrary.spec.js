import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { List, Map } from 'immutable';
import { insertMedia, persistMedia, deleteMedia } from '../mediaLibrary';

jest.mock('coreSrc/backend');
jest.mock('ValueObjects/AssetProxy');
jest.mock('../waitUntil');
jest.mock('../../lib/urlHelper');
jest.mock('netlify-cms-lib-util', () => {
  const lib = jest.requireActual('netlify-cms-lib-util');
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
        config: Map({
          public_folder: '/media',
        }),
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
        config: Map({
          public_folder: '/media',
        }),
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

  const { currentBackend } = require('coreSrc/backend');
  const { createAssetProxy } = require('ValueObjects/AssetProxy');

  const backend = {
    persistMedia: jest.fn(() => ({ id: 'id' })),
    deleteMedia: jest.fn(),
  };

  currentBackend.mockReturnValue(backend);

  describe('persistMedia', () => {
    global.URL = { createObjectURL: jest.fn().mockReturnValue('displayURL') };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not persist media when editing draft', () => {
      const { getBlobSHA } = require('netlify-cms-lib-util');

      getBlobSHA.mockReturnValue('000000000000000');

      const { sanitizeSlug } = require('../../lib/urlHelper');
      sanitizeSlug.mockReturnValue('name.png');

      const store = mockStore({
        config: Map({
          media_folder: 'static/media',
        }),
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
      const assetProxy = { path: 'static/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(2);
        expect(actions[0]).toEqual({
          type: 'ADD_ASSET',
          payload: { path: 'static/media/name.png' },
        });
        expect(actions[1]).toEqual({
          type: 'ADD_DRAFT_ENTRY_MEDIA_FILE',
          payload: {
            draft: true,
            id: '000000000000000',
            path: 'static/media/name.png',
            size: file.size,
            name: file.name,
          },
        });

        expect(getBlobSHA).toHaveBeenCalledTimes(1);
        expect(getBlobSHA).toHaveBeenCalledWith(file);
        expect(backend.persistMedia).toHaveBeenCalledTimes(0);
      });
    });

    it('should persist media when not editing draft', () => {
      const store = mockStore({
        config: Map({
          media_folder: 'static/media',
        }),
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

      const file = new File([''], 'name.png');
      const assetProxy = { path: 'static/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(3);

        expect(actions).toHaveLength(3);
        expect(actions[0]).toEqual({ type: 'MEDIA_PERSIST_REQUEST' });
        expect(actions[1]).toEqual({
          type: 'ADD_ASSET',
          payload: { path: 'static/media/name.png' },
        });
        expect(actions[2]).toEqual({
          type: 'MEDIA_PERSIST_SUCCESS',
          payload: {
            file: { id: 'id' },
          },
        });

        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
        expect(backend.persistMedia).toHaveBeenCalledWith(store.getState().config, assetProxy);
      });
    });
  });

  describe('deleteMedia', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete non draft file', () => {
      const store = mockStore({
        config: Map({
          publish_mode: 'editorial_workflow',
        }),
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
      const assetProxy = { path: 'static/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

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
        config: Map({
          publish_mode: 'editorial_workflow',
        }),
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
      const assetProxy = { path: 'static/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

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
