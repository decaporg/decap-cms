import { fromJS, List, Map } from 'immutable';
import { actions as notifActions } from 'redux-notifications';
import { serializeValues } from 'Lib/serializeEntryValues';
import { currentBackend } from 'coreSrc/backend';
import { getIntegrationProvider } from 'Integrations';
import { getAsset, selectIntegration } from 'Reducers';
import { selectFields } from 'Reducers/collections';
import { selectCollectionEntriesCursor } from 'Reducers/cursors';
import { Cursor } from 'netlify-cms-lib-util';
import { createEntry } from 'ValueObjects/Entry';
import ValidationErrorTypes from 'Constants/validationErrorTypes';

const { notifSend } = notifActions;

/*
 * Contant Declarations
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
export const DRAFT_CHANGE = 'DRAFT_CHANGE';
export const DRAFT_CHANGE_FIELD = 'DRAFT_CHANGE_FIELD';
export const DRAFT_VALIDATION_ERRORS = 'DRAFT_VALIDATION_ERRORS';
export const DRAFT_CLEAR_ERRORS = 'DRAFT_CLEAR_ERRORS';
export const DRAFT_LOCAL_BACKUP_RETRIEVED = 'DRAFT_LOCAL_BACKUP_RETRIEVED';
export const DRAFT_CREATE_FROM_LOCAL_BACKUP = 'DRAFT_CREATE_FROM_LOCAL_BACKUP';

export const ENTRY_PERSIST_REQUEST = 'ENTRY_PERSIST_REQUEST';
export const ENTRY_PERSIST_SUCCESS = 'ENTRY_PERSIST_SUCCESS';
export const ENTRY_PERSIST_FAILURE = 'ENTRY_PERSIST_FAILURE';

export const ENTRY_DELETE_REQUEST = 'ENTRY_DELETE_REQUEST';
export const ENTRY_DELETE_SUCCESS = 'ENTRY_DELETE_SUCCESS';
export const ENTRY_DELETE_FAILURE = 'ENTRY_DELETE_FAILURE';

/*
 * Simple Action Creators (Internal)
 * We still need to export them for tests
 */
export function entryLoading(collection, slug) {
  return {
    type: ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

export function entryLoaded(collection, entry) {
  return {
    type: ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

export function entryLoadError(error, collection, slug) {
  return {
    type: ENTRY_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug,
    },
  };
}

export function entriesLoading(collection) {
  return {
    type: ENTRIES_REQUEST,
    payload: {
      collection: collection.get('name'),
    },
  };
}

export function entriesLoaded(collection, entries, pagination, cursor, append = true) {
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

export function entriesFailed(collection, error) {
  return {
    type: ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error.toString(),
    meta: { collection: collection.get('name') },
  };
}

export function entryPersisting(collection, entry) {
  return {
    type: ENTRY_PERSIST_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: entry.get('slug'),
    },
  };
}

export function entryPersisted(collection, entry, slug) {
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

export function entryPersistFail(collection, entry, error) {
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

export function entryDeleting(collection, slug) {
  return {
    type: ENTRY_DELETE_REQUEST,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
    },
  };
}

export function entryDeleted(collection, slug) {
  return {
    type: ENTRY_DELETE_SUCCESS,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
    },
  };
}

export function entryDeleteFail(collection, slug, error) {
  return {
    type: ENTRY_DELETE_FAILURE,
    payload: {
      collectionName: collection.get('name'),
      entrySlug: slug,
      error: error.toString(),
    },
  };
}

export function emptyDraftCreated(entry) {
  return {
    type: DRAFT_CREATE_EMPTY,
    payload: entry,
  };
}
/*
 * Exported simple Action Creators
 */
export function createDraftFromEntry(entry, metadata) {
  return {
    type: DRAFT_CREATE_FROM_ENTRY,
    payload: { entry, metadata },
  };
}

export function discardDraft() {
  return {
    type: DRAFT_DISCARD,
  };
}

export function changeDraft(entry) {
  return {
    type: DRAFT_CHANGE,
    payload: entry,
  };
}

export function changeDraftField(field, value, metadata) {
  return {
    type: DRAFT_CHANGE_FIELD,
    payload: { field, value, metadata },
  };
}

export function changeDraftFieldValidation(uniquefieldId, errors) {
  return {
    type: DRAFT_VALIDATION_ERRORS,
    payload: { uniquefieldId, errors },
  };
}

export function clearFieldErrors() {
  return { type: DRAFT_CLEAR_ERRORS };
}

export function localBackupRetrieved(entry) {
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

export function persistLocalBackup(entry, collection) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    return backend.persistLocalDraftBackup(entry, collection);
  };
}

export function retrieveLocalBackup(collection, slug) {
  return async (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entry = await backend.getLocalDraftBackup(collection, slug);
    if (entry) {
      return dispatch(localBackupRetrieved(entry));
    }
  };
}

export function deleteLocalBackup(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    return backend.deleteLocalDraftBackup(collection, slug);
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(entryLoading(collection, slug));
    return backend
      .getEntry(collection, slug)
      .then(loadedEntry => {
        return dispatch(entryLoaded(collection, loadedEntry));
      })
      .catch(error => {
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

const addAppendActionsToCursor = cursor =>
  Cursor.create(cursor).updateStore('actions', actions =>
    actions.union(appendActions.filter(v => actions.has(v.get('action'))).keySeq()),
  );

export function loadEntries(collection, page = 0) {
  return (dispatch, getState) => {
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
      .then(response => ({
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
      .then(response =>
        dispatch(
          entriesLoaded(
            collection,
            response.cursor.meta.get('usingOldPaginationAPI')
              ? response.entries.reverse()
              : response.entries,
            response.pagination,
            addAppendActionsToCursor(response.cursor),
            append,
          ),
        ),
      )
      .catch(err => {
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

function traverseCursor(backend, cursor, action) {
  if (!cursor.actions.has(action)) {
    throw new Error(`The current cursor does not support the pagination action "${action}".`);
  }
  return backend.traverseCursor(cursor, action);
}

export function traverseCollectionCursor(collection, action) {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.entries.getIn(['pages', `${collection.get('name')}`, 'isFetching'])) {
      return;
    }
    const backend = currentBackend(state.config);

    const { action: realAction, append } = appendActions.has(action)
      ? appendActions.get(action).toJS()
      : { action, append: false };
    const cursor = selectCollectionEntriesCursor(state.cursors, collection.get('name'));

    // Handle cursors representing pages in the old, integer-based
    // pagination API
    if (cursor.meta.get('usingOldPaginationAPI', false)) {
      return dispatch(loadEntries(collection, cursor.data.get('nextPage')));
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

export function createEmptyDraft(collection) {
  return dispatch => {
    const dataFields = createEmptyDraftData(collection.get('fields', List()));
    const newEntry = createEntry(collection.get('name'), '', '', { data: dataFields });
    dispatch(emptyDraftCreated(newEntry));
  };
}

function createEmptyDraftData(fields) {
  return fields.reduce((acc, item) => {
    const subfields = item.get('field') || item.get('fields');
    const list = item.get('widget') == 'list';
    const name = item.get('name');
    const defaultValue = item.get('default', null);

    if (List.isList(subfields)) {
      acc[name] = list ? [createEmptyDraftData(subfields)] : createEmptyDraftData(subfields);
      return acc;
    }

    if (Map.isMap(subfields)) {
      acc[name] = list ? [createEmptyDraftData([subfields])] : createEmptyDraftData([subfields]);
      return acc;
    }

    if (defaultValue !== null) {
      acc[name] = defaultValue;
    }

    return acc;
  }, {});
}

export function persistEntry(collection) {
  return (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');

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
    const assetProxies = entryDraft.get('mediaFiles').map(path => getAsset(state, path));
    const entry = entryDraft.get('entry');

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
      .persistEntry(state.config, collection, serializedEntryDraft, assetProxies.toJS())
      .then(slug => {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.entrySaved',
            },
            kind: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(entryPersisted(collection, serializedEntry, slug));
      })
      .catch(error => {
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

export function deleteEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(entryDeleting(collection, slug));
    return backend
      .deleteEntry(state.config, collection, slug)
      .then(() => {
        return dispatch(entryDeleted(collection, slug));
      })
      .catch(error => {
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
