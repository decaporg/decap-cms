import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteMedia,
  insertMedia,
  loadMedia,
  MEDIA_LIBRARY_PAGE_SIZE,
  persistMedia,
} from '@/core/actions/mediaLibrary';
import * as backendModule from '@/core/backend';
import { registerLocale } from '@/core/lib/registry';
import * as libUtil from '@/lib/util/index';
import { en } from '@/locales/index';
import { ConfirmDialogHost } from '@/ui';

vi.mock('../../backend');
vi.mock('../waitUntil');
vi.mock('../../../lib/util/index', async () => {
  const lib = await vi.importActual<typeof libUtil>('../../../lib/util/index');
  return {
    ...lib,
    getBlobSHA: vi.fn(),
    // Real implementation by default; tests that care stub it.
    transformImageFile: vi.fn(lib.transformImageFile),
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
        collections: {
          posts: { name: 'posts' },
        },
        entryDraft: {
          entry: { isPersisting: false, collection: 'posts' },
        },
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
        collections: {
          posts: { name: 'posts' },
        },
        entryDraft: {
          entry: { isPersisting: false, collection: 'posts' },
        },
      });

      store.dispatch(insertMedia(['foo.png']));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: ['/media/foo.png'] },
      });
    });
  });

  const currentBackend = vi.mocked(backendModule.currentBackend);

  const backend = {
    persistMedia: vi.fn(() => ({ id: 'id' })),
    deleteMedia: vi.fn(),
  };

  currentBackend.mockReturnValue(backend);

  describe('persistMedia', () => {
    (global as any).URL = { createObjectURL: vi.fn().mockReturnValue('displayURL') };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should not persist media when editing draft', () => {
      const getBlobSHA = vi.mocked(libUtil.getBlobSHA);

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
        collections: {
          posts: { name: 'posts' },
        },
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [],
        },
        entryDraft: {
          entry: { isPersisting: false, collection: 'posts' },
        },
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
        collections: {
          posts: { name: 'posts' },
        },
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [],
        },
        entryDraft: {
          entry: {},
        },
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
        collections: {
          posts: { name: 'posts' },
        },
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [],
        },
        entryDraft: {
          entry: {},
        },
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

    it('should optimize and convert raster images before persisting when enabled (DCMS-1397)', () => {
      const drawImage = vi.fn();
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' });
      const convertToBlob = vi.fn().mockResolvedValue(outputBlob);
      vi.stubGlobal(
        'createImageBitmap',
        vi.fn().mockResolvedValue({ width: 2000, height: 1000, close: vi.fn() }),
      );
      class FakeOffscreenCanvas {
        constructor(
          public width: number,
          public height: number,
        ) {}
        getContext() {
          return { drawImage };
        }
        convertToBlob = convertToBlob;
      }
      vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);

      const store = mockStore({
        config: {
          media_folder: 'static/media',
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
          media_library: {
            name: 'default',
            config: {
              image_optimization: { enabled: true, max_width: 1000, format: 'webp' },
            },
          },
        },
        collections: {
          posts: { name: 'posts' },
        },
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [],
        },
        entryDraft: {
          entry: {},
        },
      });

      const file = new File(['original'], 'photo.png', { type: 'image/png' });

      return store
        .dispatch(persistMedia(file))
        .then(() => {
          expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1000, 500);
          expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/webp', quality: undefined });

          expect(backend.persistMedia).toHaveBeenCalledTimes(1);
          expect(backend.persistMedia).toHaveBeenCalledWith(
            store.getState().config,
            expect.objectContaining({
              path: 'static/media/photo.webp',
            }),
          );
        })
        .finally(() => {
          vi.unstubAllGlobals();
        });
    });

    // decaporg #7845: `media_processing` is the canonical upload processing
    // config; `media_library.config.image_optimization` is the deprecated v4
    // predecessor.
    describe('media_processing', () => {
      function storeWith(config: Record<string, unknown>) {
        return mockStore({
          config: {
            media_folder: 'static/media',
            slug: { encoding: 'unicode', clean_accents: false, sanitize_replacement: '-' },
            ...config,
          },
          collections: { posts: { name: 'posts' } },
          integrations: { providers: {}, hooks: {} },
          mediaLibrary: { files: [] },
          entryDraft: { entry: {} },
        });
      }

      beforeEach(() => {
        vi.mocked(libUtil.transformImageFile).mockReset();
        vi.mocked(libUtil.transformImageFile).mockResolvedValue(
          new File(['processed'], 'photo.webp', { type: 'image/webp' }),
        );
      });

      it('processes the upload and stores it under the converted name', async () => {
        const store = storeWith({
          media_processing: { enabled: true, format: { enabled: true, default: 'webp' }, quality: 80 },
        });

        await store.dispatch(persistMedia(new File(['original'], 'photo.png', { type: 'image/png' })));

        expect(libUtil.transformImageFile).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'photo.png' }),
          expect.objectContaining({ format: 'webp', quality: 0.8 }),
        );
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          expect.objectContaining({ path: 'static/media/photo.webp' }),
        );
      });

      it('uses the field media_processing over the global one', async () => {
        const store = storeWith({ media_processing: { enabled: false } });
        const field = {
          name: 'image',
          widget: 'image',
          media_processing: { enabled: true, format: { enabled: true, default: 'webp' } },
        };

        await store.dispatch(
          persistMedia(new File(['original'], 'photo.png', { type: 'image/png' }), { field } as any),
        );

        expect(libUtil.transformImageFile).toHaveBeenCalledTimes(1);
      });

      it('leaves SVG uploads alone', async () => {
        const store = storeWith({
          media_processing: { enabled: true, format: { enabled: true, default: 'webp' } },
        });

        await store.dispatch(persistMedia(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })));

        expect(libUtil.transformImageFile).not.toHaveBeenCalled();
        expect(backend.persistMedia).toHaveBeenCalledWith(
          store.getState().config,
          expect.objectContaining({ path: 'static/media/logo.svg' }),
        );
      });

      it('takes precedence over the deprecated image_optimization', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const store = storeWith({
          media_processing: { enabled: true, format: { enabled: true, default: 'webp' } },
          media_library: {
            name: 'default',
            config: { image_optimization: { enabled: true, max_width: 10, format: 'jpeg' } },
          },
        });

        await store.dispatch(persistMedia(new File(['original'], 'photo.png', { type: 'image/png' })));

        expect(libUtil.transformImageFile).toHaveBeenCalledTimes(1);
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('image_optimization'));
        warn.mockRestore();
      });
    });
  });

  // DCMS-2037: the "replace existing file?" confirm shown on re-upload must
  // read from locales/*/index.ts (not hardcoded English) and use explicit
  // Replace/Cancel labels since confirming deletes the existing file.
  describe('persistMedia replace-confirm (DCMS-2037)', () => {
    beforeAll(() => {
      registerLocale('en', en);
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    function createStoreWithExistingFile() {
      return mockStore({
        config: {
          locale: 'en',
          media_folder: 'static/media',
          slug: {
            encoding: 'unicode',
            clean_accents: false,
            sanitize_replacement: '-',
          },
        },
        collections: {
          posts: { name: 'posts' },
        },
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [{ name: 'name.png', id: 'existing-id', path: 'static/media/name.png' }],
        },
        entryDraft: {
          entry: {},
        },
      });
    }

    it('opens the confirm dialog with translated title/body containing the filename', async () => {
      render(<ConfirmDialogHost />);
      const store = createStoreWithExistingFile();
      const file = new File([''], 'name.png');

      store.dispatch(persistMedia(file));

      const dialog = await screen.findByRole('alertdialog', { name: 'Replace "name.png"?' });
      expect(dialog).toHaveTextContent('"name.png" already exists. Do you want to replace it?');

      await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    it('renders translated Replace/Cancel button labels', async () => {
      render(<ConfirmDialogHost />);
      const store = createStoreWithExistingFile();
      const file = new File([''], 'name.png');

      store.dispatch(persistMedia(file));

      await screen.findByRole('alertdialog', { name: 'Replace "name.png"?' });
      expect(screen.getByRole('button', { name: 'Replace' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();

      await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    it('dispatches deleteMedia(existingFile, ...) when the replace is confirmed', async () => {
      render(<ConfirmDialogHost />);
      const store = createStoreWithExistingFile();
      const file = new File([''], 'name.png');

      const dispatched = store.dispatch(persistMedia(file));

      await screen.findByRole('alertdialog', { name: 'Replace "name.png"?' });
      await userEvent.setup().click(screen.getByRole('button', { name: 'Replace' }));
      await dispatched;

      expect(backend.deleteMedia).toHaveBeenCalledTimes(1);
      expect(backend.deleteMedia).toHaveBeenCalledWith(
        store.getState().config,
        'static/media/name.png',
      );
      expect(backend.persistMedia).toHaveBeenCalledTimes(1);
    });

    it('does not dispatch deleteMedia when the replace is cancelled', async () => {
      render(<ConfirmDialogHost />);
      const store = createStoreWithExistingFile();
      const file = new File([''], 'name.png');

      const dispatched = store.dispatch(persistMedia(file));

      await screen.findByRole('alertdialog', { name: 'Replace "name.png"?' });
      await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));
      await dispatched;

      expect(backend.deleteMedia).not.toHaveBeenCalled();
      expect(backend.persistMedia).not.toHaveBeenCalled();
    });
  });

  describe('deleteMedia', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should delete non draft file', () => {
      const store = mockStore({
        config: {
          publish_mode: 'editorial_workflow',
        },
        collections: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [],
        },
        entryDraft: {
          entry: { isPersisting: false },
        },
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
        collections: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: {
          files: [],
        },
        entryDraft: {
          entry: { isPersisting: false },
        },
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

  describe('loadMedia pagination', () => {
    function createPaginatedBackend({
      capabilities = { pagination: true, dynamicSearch: true },
      page = { files: [{ id: 'file1', path: 'file1.png' }], nextCursor: 'N1' },
    } = {}) {
      return {
        supportsMediaPagination: vi.fn(() => true),
        getMediaCapabilities: vi.fn().mockResolvedValue(capabilities),
        getMediaPage: vi.fn().mockResolvedValue(page),
        getMedia: vi.fn().mockResolvedValue([]),
      };
    }

    function createStore(mediaLibraryState = {}) {
      return mockStore({
        config: {},
        collections: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: { files: [], ...mediaLibraryState },
        entryDraft: { entry: {} },
      });
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should load page 1 without a cursor and store the next cursor', async () => {
      const paginatedBackend = createPaginatedBackend();
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore();

      await store.dispatch(loadMedia());

      expect(paginatedBackend.getMediaPage).toHaveBeenCalledTimes(1);
      expect(paginatedBackend.getMediaPage).toHaveBeenCalledWith({
        cursor: undefined,
        perPage: MEDIA_LIBRARY_PAGE_SIZE,
        folderSupport: true,
      });

      const actions = store.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ type: 'MEDIA_LOAD_REQUEST', payload: { page: 1 } });
      expect(actions[1].type).toEqual('MEDIA_LOAD_SUCCESS');
      expect(actions[1].payload).toEqual(
        expect.objectContaining({
          files: [{ id: 'file1', path: 'file1.png' }],
          page: 1,
          canPaginate: true,
          hasNextPage: true,
          cursor: 'N1',
          dynamicSearch: true,
        }),
      );
    });

    it('should pass the stored cursor when loading page 2', async () => {
      const paginatedBackend = createPaginatedBackend({
        page: { files: [{ id: 'file2', path: 'file2.png' }], nextCursor: undefined },
      });
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore({ cursor: 'N1' });

      await store.dispatch(loadMedia({ page: 2 }));

      expect(paginatedBackend.getMediaPage).toHaveBeenCalledWith({
        cursor: 'N1',
        perPage: MEDIA_LIBRARY_PAGE_SIZE,
        folderSupport: true,
      });

      const actions = store.getActions();
      expect(actions[1].type).toEqual('MEDIA_LOAD_SUCCESS');
      expect(actions[1].payload).toEqual(
        expect.objectContaining({ page: 2, hasNextPage: false }),
      );
    });

    it('should not call getMediaPage on page 2 without a stored cursor', async () => {
      const paginatedBackend = createPaginatedBackend();
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore();

      await store.dispatch(loadMedia({ page: 2 }));

      expect(paginatedBackend.getMediaPage).not.toHaveBeenCalled();

      const actions = store.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ type: 'MEDIA_LOAD_REQUEST', payload: { page: 2 } });
      expect(actions[1].type).toEqual('MEDIA_LOAD_SUCCESS');
      expect(actions[1].payload).toEqual(
        expect.objectContaining({ files: [], page: 2, canPaginate: true, hasNextPage: false }),
      );
    });

    it('should fall through to the legacy full load when pagination is not supported', async () => {
      const paginatedBackend = createPaginatedBackend({
        capabilities: { pagination: false, dynamicSearch: false },
      });
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore();

      await store.dispatch(loadMedia());

      expect(paginatedBackend.getMediaPage).not.toHaveBeenCalled();
      expect(paginatedBackend.getMedia).toHaveBeenCalledTimes(1);
      // DCMS-1575: the legacy (non-paginated) root load must also request
      // folderSupport so subfolders surface as isDirectory entries instead
      // of being flattened by the backend.
      expect(paginatedBackend.getMedia).toHaveBeenCalledWith(undefined, true);

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'MEDIA_LOAD_REQUEST', payload: { page: 1 } });
      expect(actions[1].type).toEqual('MEDIA_LOAD_SUCCESS');
    });

    it('should dispatch MEDIA_LOAD_FAILURE when getMediaPage rejects', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const paginatedBackend = createPaginatedBackend();
      paginatedBackend.getMediaPage.mockRejectedValue(new Error('boom'));
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore();

      await store.dispatch(loadMedia());

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'MEDIA_LOAD_REQUEST', payload: { page: 1 } });
      expect(actions[2]).toEqual({ type: 'MEDIA_LOAD_FAILURE', payload: { privateUpload: undefined } });

      consoleError.mockRestore();
    });

    // DCMS-1063: a failed media listing must surface to the user (toast),
    // not just land in devtools via console.error.
    it('should surface a notification toast when getMediaPage rejects', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const paginatedBackend = createPaginatedBackend();
      paginatedBackend.getMediaPage.mockRejectedValue(new Error('boom'));
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore();

      await store.dispatch(loadMedia());

      const actions = store.getActions();
      expect(actions[1]).toEqual(
        expect.objectContaining({
          type: 'NOTIFICATION_SEND',
          payload: expect.objectContaining({ type: 'error' }),
        }),
      );

      consoleError.mockRestore();
    });

    it('should forward the query to a dynamicSearch backend', async () => {
      const paginatedBackend = createPaginatedBackend();
      currentBackend.mockReturnValue(paginatedBackend);
      const store = createStore();

      await store.dispatch(loadMedia({ query: 'logo' }));

      expect(paginatedBackend.getMediaPage).toHaveBeenCalledWith({
        cursor: undefined,
        perPage: MEDIA_LIBRARY_PAGE_SIZE,
        folderSupport: true,
        query: 'logo',
      });

      const actions = store.getActions();
      expect(actions[1].type).toEqual('MEDIA_LOAD_SUCCESS');
      expect(actions[1].payload).toEqual(
        expect.objectContaining({ dynamicSearch: true, dynamicSearchQuery: 'logo' }),
      );
    });
  });

  // DCMS-1063: legacy (non-paginated) backends fall through to the plain
  // `backend.getMedia()` load; a non-404 failure there must also surface a
  // notification toast, not just a console.error.
  describe('loadMedia legacy (non-paginated) failure', () => {
    function createLegacyBackend() {
      return {
        supportsMediaPagination: vi.fn(() => false),
        getMedia: vi.fn(),
      };
    }

    function createStore() {
      return mockStore({
        config: {},
        collections: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: { files: [] },
        entryDraft: { entry: {} },
      });
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should surface a notification toast and dispatch MEDIA_LOAD_FAILURE on a non-404 error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const backend = createLegacyBackend();
      backend.getMedia.mockRejectedValue({ status: 500, message: 'boom' });
      currentBackend.mockReturnValue(backend);
      const store = createStore();

      await store.dispatch(loadMedia());

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'MEDIA_LOAD_REQUEST', payload: { page: 1 } });
      expect(actions[1]).toEqual(
        expect.objectContaining({
          type: 'NOTIFICATION_SEND',
          payload: expect.objectContaining({ type: 'error' }),
        }),
      );
      expect(actions[2]).toEqual({ type: 'MEDIA_LOAD_FAILURE', payload: { privateUpload: undefined } });

      consoleError.mockRestore();
    });

    it('should not surface a notification on an expected 404', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const backend = createLegacyBackend();
      backend.getMedia.mockRejectedValue({ status: 404 });
      currentBackend.mockReturnValue(backend);
      const store = createStore();

      await store.dispatch(loadMedia());

      const actions = store.getActions();
      expect(actions.some(a => a.type === 'NOTIFICATION_SEND')).toBe(false);
      expect(actions[1]).toEqual({ type: 'MEDIA_LOAD_SUCCESS', payload: { files: [] } });

      consoleError.mockRestore();
    });
  });

  // Folder-scoped navigation (DCMS-1398): passing `folder` always uses the
  // single-shot `backend.getMedia(folder, true)` listing, bypassing
  // pagination/integration surfaces that don't support scoping to an
  // arbitrary folder.
  describe('loadMedia folder navigation', () => {
    function createStore() {
      return mockStore({
        config: {},
        collections: {},
        integrations: { providers: {}, hooks: {} },
        mediaLibrary: { files: [] },
        entryDraft: { entry: {} },
      });
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('lists the requested folder via getMedia(folder, true) and skips getMediaPage', async () => {
      const files = [{ id: '1', name: 'a.png', path: 'static/media/posts/a.png' }];
      const backend = {
        supportsMediaPagination: vi.fn(() => true),
        getMediaCapabilities: vi.fn().mockResolvedValue({ pagination: true, dynamicSearch: false }),
        getMediaPage: vi.fn(),
        getMedia: vi.fn().mockResolvedValue(files),
      };
      currentBackend.mockReturnValue(backend);
      const store = createStore();

      await store.dispatch(loadMedia({ folder: 'static/media/posts' }));

      expect(backend.getMedia).toHaveBeenCalledWith('static/media/posts', true);
      expect(backend.getMediaPage).not.toHaveBeenCalled();
      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'MEDIA_LOAD_REQUEST', payload: { page: 1 } });
      expect(actions[1]).toEqual({ type: 'MEDIA_LOAD_SUCCESS', payload: { files } });
    });

    it('surfaces a notification and dispatches MEDIA_LOAD_FAILURE when the folder listing fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const backend = {
        supportsMediaPagination: vi.fn(() => false),
        getMedia: vi.fn().mockRejectedValue(new Error('boom')),
      };
      currentBackend.mockReturnValue(backend);
      const store = createStore();

      await store.dispatch(loadMedia({ folder: 'static/media/posts' }));

      const actions = store.getActions();
      expect(actions[1]).toEqual(
        expect.objectContaining({
          type: 'NOTIFICATION_SEND',
          payload: expect.objectContaining({ type: 'error' }),
        }),
      );
      expect(actions[2]).toEqual({ type: 'MEDIA_LOAD_FAILURE', payload: { privateUpload: undefined } });

      consoleError.mockRestore();
    });
  });
});
