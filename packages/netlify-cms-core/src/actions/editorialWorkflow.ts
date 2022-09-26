import { List, Map } from 'immutable';
import { get } from 'lodash';

import { currentBackend, slugFromCustomPath } from '../backend';
import { EDITORIAL_WORKFLOW, status } from '../constants/publishModes';
import ValidationErrorTypes from '../constants/validationErrorTypes';
import { EDITORIAL_WORKFLOW_ERROR } from '../lib/util';
import {
  selectEntry,
  selectPublishedSlugs,
  selectUnpublishedEntry,
  selectUnpublishedSlugs,
} from '../reducers';
import { selectEditingDraft } from '../reducers/entries';
import { navigateToEntry } from '../routing/history';
import { addSnackbar } from '../store/slices/snackbars';
import { createAssetProxy } from '../valueObjects/AssetProxy';
import {
  createDraftFromEntry,
  entryDeleted,
  getMediaAssets,
  getSerializedEntry,
  loadEntries,
  loadEntry,
} from './entries';
import { addAssets } from './media';
import { loadMedia } from './mediaLibrary';

import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { Status } from '../constants/publishModes';
import type {
  Collection,
  Collections,
  EntryDraft,
  EntryMap,
  MediaFile,
  State,
} from '../types/redux';
import type { EntryValue } from '../valueObjects/Entry';

/*
 * Constant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
export const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

export const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
export const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';
export const UNPUBLISHED_ENTRY_PERSIST_FAILURE = 'UNPUBLISHED_ENTRY_PERSIST_FAILURE';

export const UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE';

export const UNPUBLISHED_ENTRY_PUBLISH_REQUEST = 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST';
export const UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS';
export const UNPUBLISHED_ENTRY_PUBLISH_FAILURE = 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE';

export const UNPUBLISHED_ENTRY_DELETE_REQUEST = 'UNPUBLISHED_ENTRY_DELETE_REQUEST';
export const UNPUBLISHED_ENTRY_DELETE_SUCCESS = 'UNPUBLISHED_ENTRY_DELETE_SUCCESS';
export const UNPUBLISHED_ENTRY_DELETE_FAILURE = 'UNPUBLISHED_ENTRY_DELETE_FAILURE';

/*
 * Simple Action Creators (Internal)
 */

function unpublishedEntryLoading(collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryLoaded(
  collection: Collection,
  entry: EntryValue & { mediaFiles: MediaFile[] },
) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryRedirected(collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_REDIRECT,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntriesLoading() {
  return {
    type: UNPUBLISHED_ENTRIES_REQUEST,
  };
}

function unpublishedEntriesLoaded(entries: EntryValue[], pagination: number) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination,
    },
  };
}

function unpublishedEntriesFailed(error: Error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error,
  };
}

function unpublishedEntryPersisting(collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryPersisted(collection: Collection, entry: EntryMap) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryPersistedFail(error: Error, collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug,
    },
    error,
  };
}

function unpublishedEntryStatusChangeRequest(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: {
      collection,
      slug,
    },
  };
}

function unpublishedEntryStatusChangePersisted(
  collection: string,
  slug: string,
  newStatus: Status,
) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: {
      collection,
      slug,
      newStatus,
    },
  };
}

function unpublishedEntryStatusChangeError(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: { collection, slug },
  };
}

function unpublishedEntryPublishRequest(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: { collection, slug },
  };
}

function unpublishedEntryPublished(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: { collection, slug },
  };
}

function unpublishedEntryPublishError(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: { collection, slug },
  };
}

function unpublishedEntryDeleteRequest(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_REQUEST,
    payload: { collection, slug },
  };
}

function unpublishedEntryDeleted(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_SUCCESS,
    payload: { collection, slug },
  };
}

function unpublishedEntryDeleteError(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_FAILURE,
    payload: { collection, slug },
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadUnpublishedEntry(collection: Collection, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);
    //run possible unpublishedEntries migration
    if (!entriesLoaded) {
      try {
        const { entries, pagination } = await backend.unpublishedEntries(state.collections);
        dispatch(unpublishedEntriesLoaded(entries, pagination));
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    dispatch(unpublishedEntryLoading(collection, slug));

    try {
      const entry = (await backend.unpublishedEntry(state, collection, slug)) as EntryValue;
      const assetProxies = await Promise.all(
        entry.mediaFiles
          .filter(file => file.draft)
          .map(({ url, file, path }) =>
            createAssetProxy({
              path,
              url,
              file,
            }),
          ),
      );
      dispatch(addAssets(assetProxies));
      dispatch(unpublishedEntryLoaded(collection, entry));
      dispatch(createDraftFromEntry(entry));
    } catch (error: any) {
      if (error.name === EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(
          addSnackbar({
            type: 'error',
            message: { key: 'ui.toast.onFailToLoadEntries', details: error },
          }),
        );
      }
    }
  };
}

export function loadUnpublishedEntries(collections: Collections) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);

    if (state.config.publish_mode !== EDITORIAL_WORKFLOW || entriesLoaded) {
      return;
    }

    dispatch(unpublishedEntriesLoading());
    backend
      .unpublishedEntries(collections)
      .then(response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)))
      .catch((error: Error) => {
        dispatch(
          addSnackbar({
            type: 'error',
            message: { key: 'ui.toast.onFailToLoadEntries', details: error },
          }),
        );
        dispatch(unpublishedEntriesFailed(error));
        Promise.reject(error);
      });
  };
}

export function persistUnpublishedEntry(collection: Collection, existingUnpublishedEntry: boolean) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');
    const unpublishedSlugs = selectUnpublishedSlugs(state, collection.get('name'));
    const publishedSlugs = selectPublishedSlugs(state, collection.get('name'));
    const usedSlugs = publishedSlugs.concat(unpublishedSlugs) as List<string>;
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);

    //load unpublishedEntries
    !entriesLoaded && dispatch(loadUnpublishedEntries(state.collections));

    // Early return if draft contains validation errors
    if (!fieldsErrors.isEmpty()) {
      const hasPresenceErrors = fieldsErrors.some(errors =>
        errors.some(error => error.type && error.type === ValidationErrorTypes.PRESENCE),
      );

      if (hasPresenceErrors) {
        dispatch(
          addSnackbar({
            type: 'error',
            message: { key: 'ui.toast.missingRequiredField' },
          }),
        );
      }
      return Promise.reject();
    }

    const backend = currentBackend(state.config);
    const entry = entryDraft.get('entry');
    const assetProxies = getMediaAssets({
      entry,
    });

    const serializedEntry = getSerializedEntry(collection, entry);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);

    dispatch(unpublishedEntryPersisting(collection, entry.get('slug')));
    const persistAction = existingUnpublishedEntry
      ? backend.persistUnpublishedEntry
      : backend.persistEntry;

    try {
      const newSlug = await persistAction.call(backend, {
        config: state.config,
        collection,
        entryDraft: serializedEntryDraft,
        assetProxies,
        usedSlugs,
      });
      dispatch(
        addSnackbar({
          type: 'success',
          message: { key: 'ui.toast.entrySaved' },
        }),
      );
      dispatch(unpublishedEntryPersisted(collection, serializedEntry));

      if (entry.get('slug') !== newSlug) {
        dispatch(loadUnpublishedEntry(collection, newSlug));
        navigateToEntry(collection.get('name'), newSlug);
      }
    } catch (error: any) {
      dispatch(
        addSnackbar({
          type: 'error',
          message: { key: 'ui.toast.onFailToPersist', details: error },
        }),
      );
      return Promise.reject(
        dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug'))),
      );
    }
  };
}

export function updateUnpublishedEntryStatus(
  collection: string,
  slug: string,
  oldStatus: Status,
  newStatus: Status,
) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (oldStatus === newStatus) return;
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryStatusChangeRequest(collection, slug));
    backend
      .updateUnpublishedEntryStatus(collection, slug, newStatus)
      .then(() => {
        dispatch(
          addSnackbar({
            type: 'success',
            message: { key: 'ui.toast.entryUpdated' },
          }),
        );
        dispatch(unpublishedEntryStatusChangePersisted(collection, slug, newStatus));
      })
      .catch((error: Error) => {
        dispatch(
          addSnackbar({
            type: 'error',
            message: { key: 'ui.toast.onFailToUpdateStatus', details: error },
          }),
        );
        dispatch(unpublishedEntryStatusChangeError(collection, slug));
      });
  };
}

export function deleteUnpublishedEntry(collection: string, slug: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryDeleteRequest(collection, slug));
    return backend
      .deleteUnpublishedEntry(collection, slug)
      .then(() => {
        dispatch(
          addSnackbar({
            type: 'success',
            message: { key: 'ui.toast.onDeleteUnpublishedChanges' },
          }),
        );
        dispatch(unpublishedEntryDeleted(collection, slug));
      })
      .catch((error: Error) => {
        dispatch(
          addSnackbar({
            type: 'error',
            message: { key: 'ui.toast.onDeleteUnpublishedChanges', details: error },
          }),
        );
        dispatch(unpublishedEntryDeleteError(collection, slug));
      });
  };
}

export function publishUnpublishedEntry(collectionName: string, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const collections = state.collections;
    const backend = currentBackend(state.config);
    const entry = selectUnpublishedEntry(state, collectionName, slug);
    dispatch(unpublishedEntryPublishRequest(collectionName, slug));
    try {
      await backend.publishUnpublishedEntry(entry);
      // re-load media after entry was published
      dispatch(loadMedia());
      dispatch(
        addSnackbar({
          type: 'success',
          message: { key: 'ui.toast.entryPublished' },
        }),
      );
      dispatch(unpublishedEntryPublished(collectionName, slug));
      const collection = collections.get(collectionName);
      if (collection.has('nested')) {
        dispatch(loadEntries(collection));
        const newSlug = slugFromCustomPath(collection, entry.get('path'));
        loadEntry(collection, newSlug);
        if (slug !== newSlug && selectEditingDraft(state.entryDraft)) {
          navigateToEntry(collection.get('name'), newSlug);
        }
      } else {
        return dispatch(loadEntry(collection, slug));
      }
    } catch (error) {
      dispatch(
        addSnackbar({
          type: 'error',
          message: { key: 'ui.toast.onFailToPublishEntry', details: error },
        }),
      );
      dispatch(unpublishedEntryPublishError(collectionName, slug));
    }
  };
}

export function unpublishPublishedEntry(collection: Collection, slug: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entry = selectEntry(state, collection.get('name'), slug);
    const entryDraft = Map().set('entry', entry) as unknown as EntryDraft;
    dispatch(unpublishedEntryPersisting(collection, slug));
    return backend
      .deleteEntry(state, collection, slug)
      .then(() =>
        backend.persistEntry({
          config: state.config,
          collection,
          entryDraft,
          assetProxies: [],
          usedSlugs: List(),
          status: status.get('PENDING_PUBLISH'),
        }),
      )
      .then(() => {
        dispatch(unpublishedEntryPersisted(collection, entry));
        dispatch(entryDeleted(collection, slug));
        dispatch(loadUnpublishedEntry(collection, slug));
        dispatch(
          addSnackbar({
            type: 'success',
            message: { key: 'ui.toast.entryUnpublished' },
          }),
        );
      })
      .catch((error: Error) => {
        dispatch(
          addSnackbar({
            type: 'error',
            message: { key: 'ui.toast.onFailToUnpublishEntry', details: error },
          }),
        );
        dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug')));
      });
  };
}
