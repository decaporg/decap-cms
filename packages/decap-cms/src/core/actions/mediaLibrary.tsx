import { currentBackend } from '@/core/backend';
import { createTranslator } from '@/core/i18n';
import { getIntegrationProvider } from '@/core/integrations';
import { selectAssetCollectionForFolder } from '@/core/lib/assetCollections';
import { assetFilenameFormatter } from '@/core/lib/formatters';
import { getPhrases } from '@/core/lib/phrases';
import { sanitizeSlug } from '@/core/lib/urlHelper';
import { selectLocale } from '@/core/reducers/config';
import {
  selectEditingDraft,
  selectMediaFilePath,
  selectMediaFilePublicPath,
  selectMediaFolder,
} from '@/core/reducers/entries';
import { selectMediaDisplayURL, selectMediaFiles } from '@/core/reducers/mediaLibrary';
import { selectIntegration } from '@/core/reducers/selectors';
import { createAssetProxy } from '@/core/valueObjects/AssetProxy';
import {
  basename,
  getBlobSHA,
  getMediaProcessingConfig,
  isImageOptimizationEnabled,
  optimizeImageFile,
  shouldTransformImage,
  transformImageFile,
} from '@/lib/util/index';
import { confirmDialog } from '@/ui';
import { addDraftEntryMediaFile, removeDraftEntryMediaFile } from './entries';
import { addAsset, removeAsset } from './media';
import { addNotification } from './notifications';
import { waitUntilWithTimeout } from './waitUntil';

import type AssetStore from '@/core/integrations/providers/assetStore/implementation';
import type AssetProxy from '@/core/valueObjects/AssetProxy';
import type {
  CmsEntryField,
  CmsImageOptimizationConfig,
  CmsMediaFile,
  CmsMediaLibraryInstance,
} from '@/lib/util/index';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

type MediaFile = CmsMediaFile;
type EntryField = CmsEntryField;
type MediaLibraryInstance = CmsMediaLibraryInstance;
type DisplayURLState = { isFetching: boolean, url?: string, err?: Error };

type State = any;

export const MEDIA_LIBRARY_OPEN = 'MEDIA_LIBRARY_OPEN';
export const MEDIA_LIBRARY_CLOSE = 'MEDIA_LIBRARY_CLOSE';
export const MEDIA_LIBRARY_CREATE = 'MEDIA_LIBRARY_CREATE';
export const MEDIA_INSERT = 'MEDIA_INSERT';
export const MEDIA_REMOVE_INSERTED = 'MEDIA_REMOVE_INSERTED';
export const MEDIA_LOAD_REQUEST = 'MEDIA_LOAD_REQUEST';
export const MEDIA_LOAD_SUCCESS = 'MEDIA_LOAD_SUCCESS';
export const MEDIA_LOAD_FAILURE = 'MEDIA_LOAD_FAILURE';
export const MEDIA_PERSIST_REQUEST = 'MEDIA_PERSIST_REQUEST';
export const MEDIA_PERSIST_SUCCESS = 'MEDIA_PERSIST_SUCCESS';
export const MEDIA_PERSIST_FAILURE = 'MEDIA_PERSIST_FAILURE';
export const MEDIA_DELETE_REQUEST = 'MEDIA_DELETE_REQUEST';
export const MEDIA_DELETE_SUCCESS = 'MEDIA_DELETE_SUCCESS';
export const MEDIA_DELETE_FAILURE = 'MEDIA_DELETE_FAILURE';
export const MEDIA_DISPLAY_URL_REQUEST = 'MEDIA_DISPLAY_URL_REQUEST';
export const MEDIA_DISPLAY_URL_SUCCESS = 'MEDIA_DISPLAY_URL_SUCCESS';
export const MEDIA_DISPLAY_URL_FAILURE = 'MEDIA_DISPLAY_URL_FAILURE';

export function createMediaLibrary(instance: MediaLibraryInstance) {
  const api = {
    show: instance.show || (() => undefined),
    hide: instance.hide || (() => undefined),
    onClearControl: instance.onClearControl || (() => undefined),
    onRemoveControl: instance.onRemoveControl || (() => undefined),
    enableStandalone: instance.enableStandalone || (() => undefined),
  };
  return { type: MEDIA_LIBRARY_CREATE, payload: api } as const;
}

export function clearMediaControl(id: string) {
  return (_dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      mediaLibrary.onClearControl({ id });
    }
  };
}

export function removeMediaControl(id: string) {
  return (_dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      mediaLibrary.onRemoveControl({ id });
    }
  };
}

export function openMediaLibrary(
  payload: {
    controlID?: string,
    forImage?: boolean,
    privateUpload?: boolean,
    value?: string,
    allowMultiple?: boolean,
    config?: Record<string, unknown>,
    field?: EntryField,
  } = {},
) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      const { controlID: id, value, config = {}, allowMultiple, forImage } = payload;

      mediaLibrary.show({ id, value, config: config as any, allowMultiple, imagesOnly: forImage });
    }
    dispatch(mediaLibraryOpened(payload));
  };
}

export function closeMediaLibrary() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      mediaLibrary.hide();
    }
    dispatch(mediaLibraryClosed());
  };
}

export function insertMedia(mediaPath: string | string[], field: EntryField | undefined) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const config = state.config;
    const entry = state.entryDraft.entry;
    const collectionName = entry?.collection as string | undefined;
    const collection = collectionName != null ? state.collections[collectionName] : null;
    if (Array.isArray(mediaPath)) {
      mediaPath = mediaPath.map(path =>
        selectMediaFilePublicPath(config, collection as any, path, entry, field as any)
      );
    } else {
      mediaPath = selectMediaFilePublicPath(
        config,
        collection as any,
        mediaPath as string,
        entry,
        field as any,
      );
    }
    dispatch(mediaInserted(mediaPath));
  };
}

export function removeInsertedMedia(controlID: string) {
  return { type: MEDIA_REMOVE_INSERTED, payload: { controlID } } as const;
}

/**
 * Page size requested from backends that support paginated media loading.
 * Backends may return slightly more or fewer items per page (e.g. when they
 * filter server-side); the cursor, not the count, drives the iteration.
 */
export const MEDIA_LIBRARY_PAGE_SIZE = 100;

export function loadMedia(
  opts: {
    delay?: number,
    query?: string,
    page?: number,
    privateUpload?: boolean,
    /**
     * Lists a specific folder instead of the configured root media_folder
     * (breadcrumb/subfolder navigation). Folder-scoped requests always use
     * the single-shot `backend.getMedia` listing below, bypassing the asset
     * store integration and cursor-paginated backend surfaces below, neither
     * of which support scoping to an arbitrary folder today.
     */
    folder?: string,
  } = {},
) {
  const { delay = 0, query = '', page = 1, privateUpload, folder } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    if (!integration && folder !== undefined) {
      dispatch(mediaLoading(page));
      try {
        const files = await backend.getMedia(folder, true);
        return dispatch(mediaLoaded(files));
      } catch (error: unknown) {
        console.error(error);
        dispatch(
          addNotification({
            message: `Failed to load media library: ${error}`,
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        return dispatch(mediaLoadFailed({ privateUpload }));
      }
    }
    if (integration) {
      // `integration` is the resolved provider for the 'assetStore' hook, so
      // the map lookup always yields an AssetStore instance here.
      const provider = getIntegrationProvider(
        state.integrations,
        backend.getToken,
        integration,
      ) as AssetStore;
      dispatch(mediaLoading(page));
      try {
        const files = await provider.retrieve(query, page, privateUpload);
        const mediaLoadedOpts = {
          page,
          canPaginate: true,
          dynamicSearch: true,
          dynamicSearchQuery: query,
          privateUpload,
        };
        return dispatch(mediaLoaded(files, mediaLoadedOpts));
      } catch (error: unknown) {
        return dispatch(mediaLoadFailed({ privateUpload }));
      }
    }

    // Paginated backend surface: load one page at a time and remember the
    // continuation cursor in state; the grid requests further pages as the
    // user scrolls. Search is delegated to the backend when it declares
    // dynamicSearch, so a query never requires the full library client-side.
    // Capabilities are consulted first (they're cached backend-side): a
    // backend may implement getMediaPage while its deployed server predates
    // cursor listing, in which case we fall through to the legacy full load.
    const capabilities = backend.supportsMediaPagination?.()
      ? await backend.getMediaCapabilities().catch(() => ({ pagination: false, dynamicSearch: false }))
      : { pagination: false, dynamicSearch: false };
    if (capabilities.pagination) {
      dispatch(mediaLoading(page));
      try {
        const cursor = page > 1 ? getState().mediaLibrary.cursor : undefined;
        if (page > 1 && cursor === undefined) {
          // Nothing to continue from (exhausted or reset mid-scroll): append
          // nothing but keep pagination state consistent.
          return dispatch(
            mediaLoaded([], {
              page,
              canPaginate: true,
              hasNextPage: false,
              ...(capabilities.dynamicSearch ? { dynamicSearch: true, dynamicSearchQuery: query } : {}),
              privateUpload,
            }),
          );
        }
        const mediaPage = await backend.getMediaPage({
          cursor,
          perPage: MEDIA_LIBRARY_PAGE_SIZE,
          folderSupport: true,
          ...(capabilities.dynamicSearch && query ? { query } : {}),
        });
        return dispatch(
          mediaLoaded(mediaPage.files, {
            page,
            canPaginate: true,
            hasNextPage: mediaPage.nextCursor !== undefined,
            cursor: mediaPage.nextCursor,
            ...(capabilities.dynamicSearch ? { dynamicSearch: true, dynamicSearchQuery: query } : {}),
            privateUpload,
          }),
        );
      } catch (error) {
        console.error(error);
        dispatch(
          addNotification({
            message: `Failed to load media library: ${error}`,
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        return dispatch(mediaLoadFailed({ privateUpload }));
      }
    }

    dispatch(mediaLoading(page));

    function loadFunction() {
      return backend
        .getMedia(undefined, true)
        .then((files: MediaFile[]) => dispatch(mediaLoaded(files)))
        .catch((error: { status?: number }) => {
          console.error(error);
          if (error.status === 404) {
            console.log('This 404 was expected and handled appropriately.');
            dispatch(mediaLoaded([]));
          } else {
            dispatch(
              addNotification({
                message: `Failed to load media library: ${error}`,
                type: 'error',
                dismissAfter: 8000,
              }),
            );
            dispatch(mediaLoadFailed());
          }
        });
    }

    if (delay > 0) {
      return new Promise(resolve => {
        setTimeout(() => resolve(loadFunction()), delay);
      });
    } else {
      return loadFunction();
    }
  };
}

function createMediaFileFromAsset({
  id,
  file,
  assetProxy,
  draft,
}: {
  id: string,
  file: File,
  assetProxy: AssetProxy,
  draft: boolean,
}): MediaFile {
  const mediaFile = {
    id,
    name: basename(assetProxy.path || ''),
    displayURL: assetProxy.url,
    draft,
    file,
    size: file.size,
    url: assetProxy.url,
    path: assetProxy.path || '',
    field: assetProxy.field as CmsEntryField | undefined,
  };
  return mediaFile;
}

/**
 * Resolves the effective image optimization config for an upload: the
 * field's own `media_library.config.image_optimization` wins over the
 * site-wide `media_library.config.image_optimization` default, matching how
 * other per-field media_library settings already override the global ones.
 */
function selectImageOptimizationConfig(
  config: State['config'],
  field: EntryField | undefined,
): CmsImageOptimizationConfig | undefined {
  const fieldMediaLibrary = field?.media_library as
    | { config?: { image_optimization?: CmsImageOptimizationConfig } }
    | undefined;
  return fieldMediaLibrary?.config?.image_optimization
    ?? config.media_library?.config?.image_optimization;
}

let warnedImageOptimizationDeprecated = false;

export function persistMedia(file: File, opts: MediaOptions = {}) {
  const { privateUpload, field } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    const files: MediaFile[] = selectMediaFiles(state, field);

    // `media_processing` (upstream's API, field over global) is the canonical
    // upload processing config. `media_library.config.image_optimization`
    // still works when it isn't set, but is deprecated.
    const mediaProcessingConfig = getMediaProcessingConfig(state.config, field as any);
    if (mediaProcessingConfig) {
      if (shouldTransformImage(file, mediaProcessingConfig)) {
        file = await transformImageFile(file, mediaProcessingConfig);
      }
    } else {
      const imageOptimizationConfig = selectImageOptimizationConfig(state.config, field);
      if (isImageOptimizationEnabled(imageOptimizationConfig)) {
        if (!warnedImageOptimizationDeprecated) {
          warnedImageOptimizationDeprecated = true;
          console.warn(
            "Decap CMS: 'media_library.config.image_optimization' is deprecated. Use 'media_processing' instead.",
          );
        }
        file = await optimizeImageFile(file, imageOptimizationConfig);
      }
    }

    let fileName = sanitizeSlug(file.name.toLowerCase(), state.config.slug);

    // Asset-collection filename renaming (DCMS-1412): only applies to the
    // plain git-backed upload path (no integration, no private upload),
    // matching the same scope selectMediaFilePath/selectMediaFolder apply to
    // below. Resolved against the target upload's own media folder, which
    // may differ per field/collection, so it's recomputed here rather than
    // reused from elsewhere.
    if (!integration && !privateUpload) {
      const uploadEntry = state.entryDraft.entry;
      const uploadCollection = uploadEntry?.collection != null
        ? state.collections[uploadEntry.collection]
        : null;
      const targetFolder = selectMediaFolder(state.config, uploadCollection as any, uploadEntry, field as any);
      const assetCollection = selectAssetCollectionForFolder(state.config, targetFolder);
      if (assetCollection?.filename_template) {
        fileName = assetFilenameFormatter(assetCollection, fileName, {
          entrySlug: uploadEntry?.slug,
          existingNames: files.map(existingFile => existingFile.name),
        });
      }
    }

    const existingFile = files.find(existingFile => existingFile.name.toLowerCase() === fileName);

    const editingDraft = selectEditingDraft(state.entryDraft);

    /**
     * Check for existing files of the same name before persisting. If no asset
     * store integration is used, files are being stored in Git, so we can
     * expect file names to be unique. If an asset store is in use, file names
     * may not be unique, so we forego this check.
     */
    if (!integration && existingFile) {
      const locale = selectLocale(state.config);
      const t = createTranslator(locale, getPhrases(locale));
      if (
        !(await confirmDialog(
          t('mediaLibrary.mediaLibrary.onReplace', { name: existingFile.name }),
          {
            title: t('mediaLibrary.mediaLibrary.onReplaceTitle', { name: existingFile.name }),
            confirmLabel: t('mediaLibrary.mediaLibrary.onReplaceConfirm'),
            cancelLabel: t('mediaLibrary.mediaLibrary.onReplaceCancel'),
            destructive: true,
          },
        ))
      ) {
        return;
      } else {
        await dispatch(deleteMedia(existingFile, { privateUpload }));
      }
    }

    if (integration || !editingDraft) {
      dispatch(mediaPersisting());
    }

    try {
      let assetProxy: AssetProxy;
      if (integration) {
        try {
          // `integration` is the resolved provider for the 'assetStore' hook, so
          // the map lookup always yields an AssetStore instance here.
          const provider = getIntegrationProvider(
            state.integrations,
            backend.getToken,
            integration,
          ) as AssetStore;
          const response = await provider.upload(file, privateUpload);
          assetProxy = createAssetProxy({
            url: response.asset.url,
            path: response.asset.url,
          });
        } catch (error: unknown) {
          assetProxy = createAssetProxy({
            file,
            path: fileName,
          });
        }
      } else if (privateUpload) {
        throw new Error('The Private Upload option is only available for Asset Store Integration');
      } else {
        const entry = state.entryDraft.entry;
        const collection = entry?.collection != null ? state.collections[entry.collection] : null;
        const path = selectMediaFilePath(
          state.config,
          collection as any,
          entry,
          fileName,
          field as any,
        );
        assetProxy = createAssetProxy({
          file,
          path,
          field,
        });
      }

      dispatch(addAsset(assetProxy));

      let mediaFile: MediaFile;
      if (integration) {
        const id = await getBlobSHA(file);
        // integration assets are persisted immediately, thus draft is false
        mediaFile = createMediaFileFromAsset({ id, file, assetProxy, draft: false });
      } else if (editingDraft) {
        const id = await getBlobSHA(file);
        mediaFile = createMediaFileFromAsset({
          id,
          file,
          assetProxy,
          draft: editingDraft,
        });
        return dispatch(addDraftEntryMediaFile(mediaFile));
      } else {
        mediaFile = await backend.persistMedia(state.config, assetProxy);
      }

      return dispatch(mediaPersisted(mediaFile, { privateUpload }));
    } catch (error: unknown) {
      console.error(error);
      dispatch(
        addNotification({
          message: `Failed to persist media: ${error}`,
          type: 'error',
          dismissAfter: 8000,
        }),
      );
      return dispatch(mediaPersistFailed({ privateUpload }));
    }
  };
}

export function deleteMedia(file: MediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, null, 'assetStore');
    if (integration) {
      // `integration` is the resolved provider for the 'assetStore' hook, so
      // the map lookup always yields an AssetStore instance here.
      const provider = getIntegrationProvider(
        state.integrations,
        backend.getToken,
        integration,
      ) as AssetStore;
      dispatch(mediaDeleting());

      try {
        await provider.delete(file.id);
        return dispatch(mediaDeleted(file, { privateUpload }));
      } catch (error: unknown) {
        console.error(error);
        dispatch(
          addNotification({
            message: `Failed to delete media: ${error instanceof Error ? error.message : String(error)}`,
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        return dispatch(mediaDeleteFailed({ privateUpload }));
      }
    }

    try {
      if (file.draft) {
        dispatch(removeAsset(file.path));
        dispatch(removeDraftEntryMediaFile({ id: file.id }));
      } else {
        const editingDraft = selectEditingDraft(state.entryDraft);

        dispatch(mediaDeleting());
        dispatch(removeAsset(file.path));

        await backend.deleteMedia(state.config, file.path);

        dispatch(mediaDeleted(file));
        if (editingDraft) {
          dispatch(removeDraftEntryMediaFile({ id: file.id }));
        }
      }
    } catch (error: unknown) {
      console.error(error);
      dispatch(
        addNotification({
          message: `Failed to delete media: ${error instanceof Error ? error.message : String(error)}`,
          type: 'error',
          dismissAfter: 8000,
        }),
      );
      return dispatch(mediaDeleteFailed());
    }
  };
}

export async function getMediaFile(state: State, path: string) {
  const backend = currentBackend(state.config);
  const { url } = await backend.getMediaFile(path);
  return { url };
}

export function loadMediaDisplayURL(file: MediaFile) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const { displayURL, id } = file;
    const state = getState();
    const displayURLState = selectMediaDisplayURL(state, id) as DisplayURLState;
    if (
      !id
      || !displayURL
      || displayURLState?.url
      || displayURLState?.isFetching
      || displayURLState?.err
    ) {
      return Promise.resolve();
    }
    if (typeof displayURL === 'string') {
      dispatch(mediaDisplayURLRequest(id));
      dispatch(mediaDisplayURLSuccess(id, displayURL));
      return;
    }
    try {
      const backend = currentBackend(state.config);
      dispatch(mediaDisplayURLRequest(id));
      const newURL = await backend.getMediaDisplayURL(displayURL);
      if (newURL) {
        dispatch(mediaDisplayURLSuccess(id, newURL));
      } else {
        throw new Error('No display URL was returned!');
      }
    } catch (err: unknown) {
      console.error(err);
      dispatch(mediaDisplayURLFailure(id, err instanceof Error ? err : new Error(String(err))));
    }
  };
}

function mediaLibraryOpened(payload: {
  controlID?: string,
  forImage?: boolean,
  privateUpload?: boolean,
  value?: string,
  replaceIndex?: number,
  allowMultiple?: boolean,
  config?: Record<string, unknown>,
  field?: EntryField,
}) {
  return { type: MEDIA_LIBRARY_OPEN, payload } as const;
}

function mediaLibraryClosed() {
  return { type: MEDIA_LIBRARY_CLOSE } as const;
}

function mediaInserted(mediaPath: string | string[]) {
  return { type: MEDIA_INSERT, payload: { mediaPath } } as const;
}

export function mediaLoading(page: number) {
  return {
    type: MEDIA_LOAD_REQUEST,
    payload: { page },
  } as const;
}

// Spread verbatim into the action payload, so an explicitly-`undefined` field
// (read off config or a backend response) is passed through rather than
// forcing every call site to build the bag key by key.
interface MediaOptions {
  privateUpload?: boolean | undefined;
  field?: EntryField | undefined;
  page?: number | undefined;
  canPaginate?: boolean | undefined;
  dynamicSearch?: boolean | undefined;
  dynamicSearchQuery?: string | undefined;
  /**
   * Authoritative "more pages exist" signal from a cursor-paginated backend.
   * When absent the reducer falls back to the legacy heuristic
   * (`canPaginate && files.length > 0`).
   */
  hasNextPage?: boolean | undefined;
  /** Continuation cursor for the next `loadMedia` page; absent when exhausted. */
  cursor?: string | undefined;
}

export function mediaLoaded(files: MediaFile[], opts: MediaOptions = {}) {
  return {
    type: MEDIA_LOAD_SUCCESS,
    payload: { files, ...opts },
  } as const;
}

export function mediaLoadFailed(opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_LOAD_FAILURE, payload: { privateUpload } } as const;
}

export function mediaPersisting() {
  return { type: MEDIA_PERSIST_REQUEST } as const;
}

export function mediaPersisted(file: MediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_PERSIST_SUCCESS,
    payload: { file, privateUpload },
  } as const;
}

export function mediaPersistFailed(opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_PERSIST_FAILURE, payload: { privateUpload } } as const;
}

export function mediaDeleting() {
  return { type: MEDIA_DELETE_REQUEST } as const;
}

export function mediaDeleted(file: MediaFile, opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return {
    type: MEDIA_DELETE_SUCCESS,
    payload: { file, privateUpload },
  } as const;
}

export function mediaDeleteFailed(opts: MediaOptions = {}) {
  const { privateUpload } = opts;
  return { type: MEDIA_DELETE_FAILURE, payload: { privateUpload } } as const;
}

export function mediaDisplayURLRequest(key: string) {
  return { type: MEDIA_DISPLAY_URL_REQUEST, payload: { key } } as const;
}

export function mediaDisplayURLSuccess(key: string, url: string) {
  return {
    type: MEDIA_DISPLAY_URL_SUCCESS,
    payload: { key, url },
  } as const;
}

export function mediaDisplayURLFailure(key: string, err: Error) {
  return {
    type: MEDIA_DISPLAY_URL_FAILURE,
    payload: { key, err },
  } as const;
}

export async function waitForMediaLibraryToLoad(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  state: State,
) {
  if (state.mediaLibrary.isLoading !== false && !state.mediaLibrary.externalLibrary) {
    await waitUntilWithTimeout(dispatch, resolve => ({
      predicate: ({ type }) => type === MEDIA_LOAD_SUCCESS || type === MEDIA_LOAD_FAILURE,
      run: () => resolve(),
    }));
  }
}

export async function getMediaDisplayURL(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  state: State,
  file: MediaFile,
) {
  const displayURLState = selectMediaDisplayURL(state, file.id) as DisplayURLState;

  let url: string | null | undefined;
  if (displayURLState?.url) {
    // url was already loaded
    url = displayURLState.url;
  } else if (displayURLState?.err) {
    // url loading had an error
    url = null;
  } else {
    const key = file.id;
    const promise = waitUntilWithTimeout<string>(dispatch, resolve => ({
      predicate: ({ type, payload }) =>
        (type === MEDIA_DISPLAY_URL_SUCCESS || type === MEDIA_DISPLAY_URL_FAILURE)
        && payload.key === key,
      run: (_dispatch, _getState, action) => resolve(action.payload.url),
    }));

    if (!displayURLState?.isFetching) {
      // load display url
      dispatch(loadMediaDisplayURL(file));
    }

    url = (await promise) ?? null;
  }

  return url;
}

export type MediaLibraryAction = ReturnType<
  | typeof createMediaLibrary
  | typeof mediaLibraryOpened
  | typeof mediaLibraryClosed
  | typeof mediaInserted
  | typeof removeInsertedMedia
  | typeof mediaLoading
  | typeof mediaLoaded
  | typeof mediaLoadFailed
  | typeof mediaPersisting
  | typeof mediaPersisted
  | typeof mediaPersistFailed
  | typeof mediaDeleting
  | typeof mediaDeleted
  | typeof mediaDeleteFailed
  | typeof mediaDisplayURLRequest
  | typeof mediaDisplayURLSuccess
  | typeof mediaDisplayURLFailure
>;
