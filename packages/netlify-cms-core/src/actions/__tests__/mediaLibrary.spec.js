import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS, List, Map } from 'immutable';
import { insertMedia, persistMedia, deleteMedia, addMediaFilesToLibrary } from '../mediaLibrary';

jest.mock('coreSrc/backend');
jest.mock('ValueObjects/AssetProxy');
jest.mock('../waitUntil');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mediaLibrary', () => {
  describe('insertMedia', () => {
    it('should return url when input is an object with url property', () => {
      const store = mockStore({});
      store.dispatch(insertMedia({ url: '//localhost/foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '//localhost/foo.png' },
      });
    });

    it('should resolve to relative path when media_folder_relative is true and object with name property is given', () => {
      const store = mockStore({
        config: fromJS({
          media_folder_relative: true,
          media_folder: 'content/media',
        }),
        entryDraft: fromJS({
          entry: {
            collection: 'blog-posts',
          },
        }),
        collections: fromJS({
          'blog-posts': {
            folder: 'content/blog/posts',
          },
        }),
      });
      store.dispatch(insertMedia({ name: 'foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '../../media/foo.png' },
      });
    });

    it('should resolve to relative path and ignore public_folder when media_folder_relative is true', () => {
      const store = mockStore({
        config: fromJS({
          media_folder_relative: true,
          media_folder: 'content/media',
          public_folder: '/static/assets/media',
        }),
        entryDraft: fromJS({
          entry: {
            collection: 'blog-posts',
          },
        }),
        collections: fromJS({
          'blog-posts': {
            folder: 'content/blog/posts',
          },
        }),
      });
      store.dispatch(insertMedia({ name: 'foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '../../media/foo.png' },
      });
    });

    it('should not resolve to relative path when media_folder_relative is not true', () => {
      const store = mockStore({
        config: fromJS({
          public_folder: '/static/assets/media',
        }),
      });
      store.dispatch(insertMedia({ name: 'foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '/static/assets/media/foo.png' },
      });
    });

    it('should return mediaPath as string when string is given', () => {
      const store = mockStore({});
      store.dispatch(insertMedia('foo.png'));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: 'foo.png' },
      });
    });

    it('should return mediaPath as array of strings when array of strings is given', () => {
      const store = mockStore({});
      store.dispatch(insertMedia(['foo.png']));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: ['foo.png'] },
      });
    });

    it('should throw an error when not a object with url or name property, a string or a string array', () => {
      const store = mockStore();

      expect.assertions(1);
      try {
        store.dispatch(insertMedia({ foo: 'foo.png' }));
      } catch (e) {
        expect(e.message).toEqual(
          'Incorrect usage, expected {url}, {file}, string or string array',
        );
      }
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

    it('should persist media as draft in editorial workflow', () => {
      const store = mockStore({
        config: Map({
          publish_mode: 'editorial_workflow',
        }),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false }),
        }),
      });

      const file = new File([''], 'name.png');
      const assetProxy = { public_path: '/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(4);
        expect(actions[0]).toEqual({ type: 'MEDIA_PERSIST_REQUEST' });
        expect(actions[1]).toEqual({
          type: 'ADD_ASSET',
          payload: { public_path: '/media/name.png' },
        });
        expect(actions[2]).toEqual({
          type: 'ADD_DRAFT_ENTRY_MEDIA_FILE',
          payload: { draft: true, id: 'id', public_path: '/media/name.png' },
        });
        expect(actions[3]).toEqual({
          type: 'MEDIA_PERSIST_SUCCESS',
          payload: {
            file: { draft: true, id: 'id', displayURL: 'displayURL' },
          },
        });

        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          assetProxy,
          true,
        );
      });
    });

    it('should not persist media as draft when not in editorial workflow', () => {
      const store = mockStore({
        config: Map({}),
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false }),
        }),
      });

      const file = new File([''], 'name.png');
      const assetProxy = { public_path: '/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(persistMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(3);
        expect(actions[0]).toEqual({ type: 'MEDIA_PERSIST_REQUEST' });
        expect(actions[1]).toEqual({
          type: 'ADD_ASSET',
          payload: { public_path: '/media/name.png' },
        });
        expect(actions[2]).toEqual({
          type: 'MEDIA_PERSIST_SUCCESS',
          payload: {
            file: { draft: false, id: 'id', displayURL: 'displayURL' },
          },
        });

        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          assetProxy,
          false,
        );
      });
    });

    it('should not persist media as draft when draft is empty', () => {
      const store = mockStore({
        config: Map({
          publish_mode: 'editorial_workflow',
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
      const assetProxy = { public_path: '/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(persistMedia(file)).then(() => {
        expect(backend.persistMedia).toHaveBeenCalledTimes(1);
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          assetProxy,
          false,
        );
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
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false }),
        }),
      });

      const file = { name: 'name.png', id: 'id', path: 'static/media/name.png', draft: false };
      const assetProxy = { public_path: '/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(deleteMedia(file)).then(() => {
        const actions = store.getActions();

        expect(actions).toHaveLength(4);
        expect(actions[0]).toEqual({ type: 'MEDIA_DELETE_REQUEST' });
        expect(actions[1]).toEqual({
          type: 'REMOVE_ASSET',
          payload: '/media/name.png',
        });
        expect(actions[2]).toEqual({
          type: 'REMOVE_DRAFT_ENTRY_MEDIA_FILE',
          payload: { id: 'id' },
        });
        expect(actions[3]).toEqual({
          type: 'MEDIA_DELETE_SUCCESS',
          payload: { file },
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
        integrations: Map(),
        mediaLibrary: Map({
          files: List(),
        }),
        entryDraft: Map({
          entry: Map({ isPersisting: false }),
        }),
      });

      const file = { name: 'name.png', id: 'id', path: 'static/media/name.png', draft: true };
      const assetProxy = { public_path: '/media/name.png' };
      createAssetProxy.mockReturnValue(assetProxy);

      return store.dispatch(deleteMedia(file)).then(() => {
        expect(backend.deleteMedia).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('addMediaFilesToLibrary', () => {
    it('should not wait if media library is loaded', () => {
      const store = mockStore({
        mediaLibrary: Map({
          isLoading: false,
        }),
      });

      const mediaFiles = [{ id: '1' }];
      store.dispatch(addMediaFilesToLibrary(mediaFiles));

      const actions = store.getActions();

      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        payload: { mediaFiles: [{ id: '1' }] },
        type: 'ADD_MEDIA_FILES_TO_LIBRARY',
      });
    });

    it('should wait if media library is not loaded', () => {
      const { waitUntil } = require('../waitUntil');

      waitUntil.mockImplementation(payload => ({ type: 'WAIT_UNTIL', ...payload }));

      const store = mockStore({
        mediaLibrary: Map({}),
      });

      const mediaFiles = [{ id: '1' }];
      store.dispatch(addMediaFilesToLibrary(mediaFiles));

      const actions = store.getActions();

      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: 'WAIT_UNTIL',
        predicate: expect.any(Function),
        run: expect.any(Function),
      });

      expect(actions[0].predicate({ type: 'MEDIA_LOAD_SUCCESS' })).toBe(true);
      expect(actions[0].run(store.dispatch)).toEqual({
        payload: { mediaFiles: [{ id: '1' }] },
        type: 'ADD_MEDIA_FILES_TO_LIBRARY',
      });
    });
  });
});
