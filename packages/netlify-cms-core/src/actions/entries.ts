import { fromJS, List, Map, Set } from 'immutable';
import { isEqual } from 'lodash';
import { actions as notifActions } from 'redux-notifications';
import { serializeValues } from '../lib/serializeEntryValues';
import { currentBackend, Backend } from '../backend';
import { getIntegrationProvider } from '../integrations';
import { selectIntegration, selectPublishedSlugs } from '../reducers';
import { selectFields } from '../reducers/collections';
import { selectCollectionEntriesCursor } from '../reducers/cursors';
import { Cursor, ImplementationMediaFile } from 'netlify-cms-lib-util';
import { createEntry, EntryValue } from '../valueObjects/Entry';
import AssetProxy, { createAssetProxy } from '../valueObjects/AssetProxy';
import ValidationErrorTypes from '../constants/validationErrorTypes';
import { addAssets, getAsset } from './media';
import { Collection, EntryMap, MediaFile, State, EntryFields, EntryField } from '../types/redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction, Dispatch } from 'redux';
import { waitForMediaLibraryToLoad, loadMedia } from './mediaLibrary';
import { waitUntil } from './waitUntil';

const { notifSend } = notifActions;

/*
 * Constant Declarations
 */
export const ENTRY_REQUEST = 'ENTRY_REQUEST';
export const ENTRY_SUCCESS = 'ENTRY_SUCCESS';
export const ENTRY_FAILURE = 'ENTRY_FAILURE';

export const ENTRIES_REQUEST = 'ENTRIES_REQUEST';
export const ENTRIES_SUCCESS = 'ENTRIES_SUCCESS';
export const ENTRIES_FAILURE = 'ENTRIES_FAILURE';

export const DRAFT_CREATE_FROM_ENTRY = 'DRAFT_CREATE_FROM_ENTRY';
export const DRAFT_CREATE_EMPTY = 'DRAFT_CREATE_EMPTY';
export const DRAFT_DISCARD = 'DRAFT_DISCARD';
export const DRAFT_CHANGE_FIELD = 'DRAFT_CHANGE_FIELD';
export const DRAFT_VALIDATION_ERRORS = 'DRAFT_VALIDATION_ERRORS';
export const DRAFT_CLEAR_ERRORS = 'DRAFT_CLEAR_ERRORS';
export const DRAFT_LOCAL_BACKUP_RETRIEVED = 'DRAFT_LOCAL_BACKUP_RETRIEVED';
export const DRAFT_CREATE_FROM_LOCAL_BACKUP = 'DRAFT_CREATE_FROM_LOCAL_BACKUP';
export const DRAFT_CREATE_DUPLICATE_FROM_ENTRY = 'DRAFT_CREATE_DUPLICATE_FROM_ENTRY';

export const ENTRY_PERSIST_REQUEST = 'ENTRY_PERSIST_REQUEST';
export const ENTRY_PERSIST_SUCCESS = 'ENTRY_PERSIST_SUCCESS';
export const ENTRY_PERSIST_FAILURE = 'ENTRY_PERSIST_FAILURE';

export const ENTRY_DELETE_REQUEST = 'ENTRY_DELETE_REQUEST';
export const ENTRY_DELETE_SUCCESS = 'ENTRY_DELETE_SUCCESS';
export const ENTRY_DELETE_FAILURE = 'ENTRY_DELETE_FAILURE';

export const ADD_DRAFT_ENTRY_MEDIA_FILE = 'ADD_DRAFT_ENTRY_MEDIA_FILE';
export const REMOVE_DRAFT_ENTRY_MEDIA_FILE = 'REMOVE_DRAFT_ENTRY_MEDIA_FILE';

/*
 * Simple Action Creators (Internal)
 * We still need to export them for tests
 */
export function entryLoading(collection: Collection, slug: string) {
  return {
    type: ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

export function entryLoaded(collection: Collection, entry: EntryValue) {
  return {
    type: ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

export function entryLoadError(error: Error, collection: Collection, slug: string) {
  return {
    type: ENTRY_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug,
    },
  };
}

export function entriesLoading(collection: Collection) {
  return {
    type: ENTRIES_REQUEST,
    payload: {
      collection: collection.get('name'),
    },
  };
}

export function entriesLoaded(
  collection: Collection,
  entries: EntryValue[],
  pagination: number | null,
  cursor: Cursor,
  append = true,
) {
  return {
    type: ENTRIES_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entries,
      page: pagination,
      cursor: Cursor.create(cursor),
      append,
    },
  };
}

export function entriesFailed(collection: Collection, error: Error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: { collection: collection.get('name') },
  };
}

export function entryPersisting(collection: Collection, entry: EntryMap) {
  return {
    type: ENTRY_PERSIST_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
    },
  };
}

export function entryPersisted(collection: Collection, entry: EntryMap, slug: string) {
  return {
    type: ENTRY_PERSIST_SUCCESS,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),

      /**
       * Pass slug from backend for newly created entries.
       */
      slug,
    },
  };
}

export function entryPersistFail(collection: Collection, entry: EntryMap, error: Error) {
  return {
    type: ENTRY_PERSIST_FAILURE,
    error: 'Failed to persist entry',
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
      error: error.toString(),
    },
  };
}

export function entryDeleting(collection: Collection, slug: string) {
  return {
    type: ENTRY_DELETE_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
    },
  };
}

export function entryDeleted(collection: Collection, slug: string) {
  return {
    type: ENTRY_DELETE_SUCCESS,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
    },
  };
}

export function entryDeleteFail(collection: Collection, slug: string, error: Error) {
  return {
    type: ENTRY_DELETE_FAILURE,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
      error: error.toString(),
    },
  };
}

export function emptyDraftCreated(entry: EntryValue) {
  return {
    type: DRAFT_CREATE_EMPTY,
    payload: entry,
  };
}
/*
 * Exported simple Action Creators
 */
export function createDraftFromEntry(entry: EntryMap, metadata?: Map<string, unknown>) {
  return {
    type: DRAFT_CREATE_FROM_ENTRY,
    payload: { entry, metadata },
  };
}

export function draftDuplicateEntry(entry: EntryMap) {
  return {
    type: DRAFT_CREATE_DUPLICATE_FROM_ENTRY,
    payload: createEntry(entry.get('collection'), '', '', { data: entry.get('data') }),
  };
}

export function discardDraft() {
  return { type: DRAFT_DISCARD };
}

export function changeDraftField(field: string, value: string, metadata: Record<string, unknown>) {
  return {
    type: DRAFT_CHANGE_FIELD,
    payload: { field, value, metadata },
  };
}

export function changeDraftFieldValidation(
  uniquefieldId: string,
  errors: { type: string; message: string }[],
) {
  return {
    type: DRAFT_VALIDATION_ERRORS,
    payload: { uniquefieldId, errors },
  };
}

export function clearFieldErrors() {
  return { type: DRAFT_CLEAR_ERRORS };
}

export function localBackupRetrieved(entry: EntryValue) {
  return {
    type: DRAFT_LOCAL_BACKUP_RETRIEVED,
    payload: { entry },
  };
}

export function loadLocalBackup() {
  return {
    type: DRAFT_CREATE_FROM_LOCAL_BACKUP,
  };
}

export function addDraftEntryMediaFile(file: ImplementationMediaFile) {
  return { type: ADD_DRAFT_ENTRY_MEDIA_FILE, payload: file };
}

export function removeDraftEntryMediaFile({ id }: { id: string }) {
  return { type: REMOVE_DRAFT_ENTRY_MEDIA_FILE, payload: { id } };
}

export function persistLocalBackup(entry: EntryMap, collection: Collection) {
  return (_dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);

    return backend.persistLocalDraftBackup(entry, collection);
  };
}

export function createDraftDuplicateFromEntry(entry: EntryMap) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>) => {
    dispatch(
      waitUntil({
        predicate: ({ type }) => type === DRAFT_CREATE_EMPTY,
        run: () => dispatch(draftDuplicateEntry(entry)),
      }),
    );
  };
}

export function retrieveLocalBackup(collection: Collection, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const { entry } = await backend.getLocalDraftBackup(collection, slug);

    if (entry) {
      // load assets from backup
      const mediaFiles = entry.mediaFiles || [];
      const assetProxies: AssetProxy[] = await Promise.all(
        mediaFiles.map(file => {
          if (file.file || file.url) {
            return createAssetProxy({
              path: file.path,
              file: file.file,
              url: file.url,
              field: file.field,
            });
          } else {
            return getAsset({
              collection,
              entry: fromJS(entry),
              path: file.path,
              field: file.field,
            })(dispatch, getState);
          }
        }),
      );
      dispatch(addAssets(assetProxies));

      return dispatch(localBackupRetrieved(entry));
    }
  };
}

export function deleteLocalBackup(collection: Collection, slug: string) {
  return (_dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    return backend.deleteLocalDraftBackup(collection, slug);
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadEntry(collection: Collection, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    await waitForMediaLibraryToLoad(dispatch, getState());
    dispatch(entryLoading(collection, slug));
    return backend
      .getEntry(getState(), collection, slug)
      .then((loadedEntry: EntryValue) => {
        return dispatch(entryLoaded(collection, loadedEntry));
      })
      .catch((error: Error) => {
        console.error(error);
        dispatch(
          notifSend({
            message: {
              details: error.message,
              key: 'ui.toast.onFailToLoadEntries',
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(entryLoadError(error, collection, slug));
      });
  };
}

const appendActions = fromJS({
  ['append_next']: { action: 'next', append: true },
});

const addAppendActionsToCursor = (cursor: Cursor) => {
  return Cursor.create(cursor).updateStore('actions', (actions: Set<string>) => {
    return actions.union(
      appendActions
        .filter((v: Map<string, string | boolean>) => actions.has(v.get('action') as string))
        .keySeq(),
    );
  });
};

export function loadEntries(collection: Collection, page = 0) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (collection.get('isFetching')) {
      return;
    }
    const state = getState();
    const backend = currentBackend(state.config);
    const integration = selectIntegration(state, collection.get('name'), 'listEntries');
    const provider = integration
      ? getIntegrationProvider(state.integrations, backend.getToken, integration)
      : backend;
    const append = !!(page && !isNaN(page) && page > 0);
    dispatch(entriesLoading(collection));
    provider
      .listEntries(collection, page)
      .then((response: { cursor: typeof Cursor }) => ({
        ...response,

        // The only existing backend using the pagination system is the
        // Algolia integration, which is also the only integration used
        // to list entries. Thus, this checking for an integration can
        // determine whether or not this is using the old integer-based
        // pagination API. Other backends will simply store an empty
        // cursor, which behaves identically to no cursor at all.
        cursor: integration
          ? Cursor.create({
              actions: ['next'],
              meta: { usingOldPaginationAPI: true },
              data: { nextPage: page + 1 },
            })
          : Cursor.create(response.cursor),
      }))
      .then((response: { cursor: Cursor; pagination: number; entries: EntryValue[] }) =>
        dispatch(
          entriesLoaded(
            collection,
            response.cursor.meta!.get('usingOldPaginationAPI')
              ? response.entries.reverse()
              : response.entries,
            response.pagination,
            addAppendActionsToCursor(response.cursor),
            append,
          ),
        ),
      )
      .catch((err: Error) => {
        dispatch(
          notifSend({
            message: {
              details: err,
              key: 'ui.toast.onFailToLoadEntries',
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        return Promise.reject(dispatch(entriesFailed(collection, err)));
      });
  };
}

function traverseCursor(backend: Backend, cursor: Cursor, action: string) {
  if (!cursor.actions!.has(action)) {
    throw new Error(`The current cursor does not support the pagination action "${action}".`);
  }
  return backend.traverseCursor(cursor, action);
}

export function traverseCollectionCursor(collection: Collection, action: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const collectionName = collection.get('name');
    if (state.entries.getIn(['pages', `${collectionName}`, 'isFetching'])) {
      return;
    }
    const backend = currentBackend(state.config);

    const { action: realAction, append } = appendActions.has(action)
      ? appendActions.get(action).toJS()
      : { action, append: false };
    const cursor = selectCollectionEntriesCursor(state.cursors, collection.get('name'));

    // Handle cursors representing pages in the old, integer-based
    // pagination API
    if (cursor.meta!.get('usingOldPaginationAPI', false)) {
      return dispatch(loadEntries(collection, cursor.data!.get('nextPage') as number));
    }

    try {
      dispatch(entriesLoading(collection));
      const { entries, cursor: newCursor } = await traverseCursor(backend, cursor, realAction);
      // Pass null for the old pagination argument - this will
      // eventually be removed.
      return dispatch(
        entriesLoaded(collection, entries, null, addAppendActionsToCursor(newCursor), append),
      );
    } catch (err) {
      console.error(err);
      dispatch(
        notifSend({
          message: {
            details: err,
            key: 'ui.toast.onFailToPersist',
          },
          kind: 'danger',
          dismissAfter: 8000,
        }),
      );
      return Promise.reject(dispatch(entriesFailed(collection, err)));
    }
  };
}

export function createEmptyDraft(collection: Collection) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const dataFields = createEmptyDraftData(collection.get('fields', List()));

    let mediaFiles = [] as MediaFile[];
    if (!collection.has('media_folder')) {
      await waitForMediaLibraryToLoad(dispatch, getState());
      mediaFiles = getState().mediaLibrary.get('files');
    }

    const newEntry = createEntry(collection.get('name'), '', '', { data: dataFields, mediaFiles });
    dispatch(emptyDraftCreated(newEntry));
  };
}

interface DraftEntryData {
  [name: string]: string | null | DraftEntryData | DraftEntryData[] | (string | DraftEntryData)[];
}

export function createEmptyDraftData(fields: EntryFields, withNameKey = true) {
  return fields.reduce(
    (reduction: DraftEntryData | string | undefined, value: EntryField | undefined) => {
      const acc = reduction as DraftEntryData;
      const item = value as EntryField;
      const subfields = item.get('field') || item.get('fields');
      const list = item.get('widget') == 'list';
      const name = item.get('name');
      const defaultValue = item.get('default', null);
      const isEmptyDefaultValue = (val: unknown) => [[{}], {}].some(e => isEqual(val, e));

      if (List.isList(subfields)) {
        const subDefaultValue = list
          ? [createEmptyDraftData(subfields as EntryFields)]
          : createEmptyDraftData(subfields as EntryFields);
        if (!isEmptyDefaultValue(subDefaultValue)) {
          acc[name] = subDefaultValue;
        }
        return acc;
      }

      if (Map.isMap(subfields)) {
        const subDefaultValue = list
          ? [createEmptyDraftData(List([subfields as EntryField]), false)]
          : createEmptyDraftData(List([subfields as EntryField]));
        if (!isEmptyDefaultValue(subDefaultValue)) {
          acc[name] = subDefaultValue;
        }
        return acc;
      }

      if (defaultValue !== null) {
        if (!withNameKey) {
          return defaultValue;
        }
        acc[name] = defaultValue;
      }

      return acc;
    },
    {} as DraftEntryData,
  );
}

export async function getMediaAssets({
  getState,
  dispatch,
  collection,
  entry,
}: {
  getState: () => State;
  collection: Collection;
  entry: EntryMap;
  dispatch: Dispatch;
}) {
  const filesArray = entry.get('mediaFiles').toArray();
  const assets = await Promise.all(
    filesArray
      .filter(file => file.get('draft'))
      .map(file =>
        getAsset({ collection, entry, path: file.get('path'), field: file.get('field') })(
          dispatch,
          getState,
        ),
      ),
  );

  return assets;
}

export function persistEntry(collection: Collection) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');
    const usedSlugs = selectPublishedSlugs(state, collection.get('name'));

    // Early return if draft contains validation errors
    if (!fieldsErrors.isEmpty()) {
      const hasPresenceErrors = fieldsErrors.some(errors =>
        errors.some(error => error.type && error.type === ValidationErrorTypes.PRESENCE),
      );

      if (hasPresenceErrors) {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.missingRequiredField',
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
      }

      return Promise.reject();
    }

    const backend = currentBackend(state.config);
    const entry = entryDraft.get('entry');
    const assetProxies = await getMediaAssets({
      getState,
      dispatch,
      collection,
      entry,
    });

    /**
     * Serialize the values of any fields with registered serializers, and
     * update the entry and entryDraft with the serialized values.
     */
    const fields = selectFields(collection, entry.get('slug'));
    const serializedData = serializeValues(entryDraft.getIn(['entry', 'data']), fields);
    const serializedEntry = entry.set('data', serializedData);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);
    dispatch(entryPersisting(collection, serializedEntry));
    return backend
      .persistEntry({
        config: state.config,
        collection,
        entryDraft: serializedEntryDraft,
        assetProxies,
        usedSlugs,
      })
      .then((slug: string) => {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.entrySaved',
            },
            kind: 'success',
            dismissAfter: 4000,
          }),
        );
        // re-load media library if entry had media files
        if (assetProxies.length > 0) {
          dispatch(loadMedia());
        }
        dispatch(entryPersisted(collection, serializedEntry, slug));
      })
      .catch((error: Error) => {
        console.error(error);
        dispatch(
          notifSend({
            message: {
              details: error,
              key: 'ui.toast.onFailToPersist',
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        return Promise.reject(dispatch(entryPersistFail(collection, serializedEntry, error)));
      });
  };
}

export function deleteEntry(collection: Collection, slug: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(entryDeleting(collection, slug));
    return backend
      .deleteEntry(state, collection, slug)
      .then(() => {
        return dispatch(entryDeleted(collection, slug));
      })
      .catch((error: Error) => {
        dispatch(
          notifSend({
            message: {
              details: error,
              key: 'ui.toast.onFailToDelete',
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        console.error(error);
        return Promise.reject(dispatch(entryDeleteFail(collection, slug, error)));
      });
  };
}
