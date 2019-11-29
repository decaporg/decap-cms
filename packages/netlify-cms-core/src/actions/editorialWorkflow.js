import uuid from 'uuid/v4';
import { get } from 'lodash';
import { actions as notifActions } from 'redux-notifications';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { Map } from 'immutable';
import { serializeValues } from 'Lib/serializeEntryValues';
import { currentBackend } from 'coreSrc/backend';
import { selectPublishedSlugs, selectUnpublishedSlugs, selectEntry } from 'Reducers';
import { selectFields } from 'Reducers/collections';
import { EDITORIAL_WORKFLOW, status } from 'Constants/publishModes';
import { EDITORIAL_WORKFLOW_ERROR } from 'netlify-cms-lib-util';
import {
  loadEntry,
  entryDeleted,
  getMediaAssets,
  setDraftEntryMediaFiles,
  clearDraftEntryMediaFiles,
} from './entries';
import { createAssetProxy } from 'ValueObjects/AssetProxy';
import { addAssets } from './media';
import { addMediaFilesToLibrary } from './mediaLibrary';

import ValidationErrorTypes from 'Constants/validationErrorTypes';

const { notifSend } = notifActions;

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

function unpublishedEntryLoading(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryLoaded(collection, entry) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryRedirected(collection, slug) {
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

function unpublishedEntriesLoaded(entries, pagination) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination,
    },
  };
}

function unpublishedEntriesFailed(error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error,
  };
}

function unpublishedEntryPersisting(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPersisted(collection, entry, transactionID, slug) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
      slug,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPersistedFail(error, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: { error },
    optimist: { type: REVERT, id: transactionID },
    error,
  };
}

function unpublishedEntryStatusChangeRequest(
  collection,
  slug,
  oldStatus,
  newStatus,
  transactionID,
) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: {
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryStatusChangePersisted(
  collection,
  slug,
  oldStatus,
  newStatus,
  transactionID,
) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: {
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryStatusChangeError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryPublishRequest(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: { collection, slug },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPublished(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: { collection, slug },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPublishError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryDeleteRequest(collection, slug, transactionID) {
  // The reducer doesn't handle this action -- it is for `optimist`.
  return {
    type: UNPUBLISHED_ENTRY_DELETE_REQUEST,
    payload: { collection, slug },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryDeleted(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_SUCCESS,
    payload: { collection, slug },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryDeleteError(collection, slug, transactionID) {
  // The reducer doesn't handle this action -- it is for `optimist`.
  return {
    type: UNPUBLISHED_ENTRY_DELETE_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadUnpublishedEntry(collection, slug) {
  return async (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);
    //run possible unpublishedEntries migration
    if (!entriesLoaded) {
      const response = await backend.unpublishedEntries(state.collections).catch(() => false);
      response && dispatch(unpublishedEntriesLoaded(response.entries, response.pagination));
    }

    dispatch(unpublishedEntryLoading(collection, slug));

    try {
      const entry = await backend.unpublishedEntry(collection, slug);
      const mediaFiles = entry.mediaFiles;
      const assetProxies = await Promise.all(
        mediaFiles.map(({ file }) => createAssetProxy(file.name, file)),
      );
      dispatch(addAssets(assetProxies));
      dispatch(
        setDraftEntryMediaFiles(
          assetProxies.map((asset, index) => ({
            ...asset,
            ...mediaFiles[index],
            draft: true,
          })),
        ),
      );
      dispatch(
        addMediaFilesToLibrary(
          mediaFiles.map(file => ({
            ...file,
            draft: true,
          })),
        ),
      );

      dispatch(unpublishedEntryLoaded(collection, entry));
    } catch (error) {
      if (error.name === EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
      }
    }
  };
}

export function loadUnpublishedEntries(collections) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);
    if (state.config.get('publish_mode') !== EDITORIAL_WORKFLOW || entriesLoaded) return;

    dispatch(unpublishedEntriesLoading());
    backend
      .unpublishedEntries(collections)
      .then(response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)))
      .catch(error => {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntriesFailed(error));
        Promise.reject(error);
      });
  };
}

export function persistUnpublishedEntry(collection, existingUnpublishedEntry) {
  return async (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');
    const unpublishedSlugs = selectUnpublishedSlugs(state, collection.get('name'));
    const publishedSlugs = selectPublishedSlugs(state, collection.get('name'));
    const usedSlugs = publishedSlugs.concat(unpublishedSlugs);
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
    const transactionID = uuid();
    const assetProxies = getMediaAssets(state, entryDraft.get('mediaFiles'));
    const entry = entryDraft.get('entry');

    /**
     * Serialize the values of any fields with registered serializers, and
     * update the entry and entryDraft with the serialized values.
     */
    const fields = selectFields(collection, entry.get('slug'));
    const serializedData = serializeValues(entryDraft.getIn(['entry', 'data']), fields);
    const serializedEntry = entry.set('data', serializedData);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);

    dispatch(unpublishedEntryPersisting(collection, serializedEntry, transactionID));
    const persistAction = existingUnpublishedEntry
      ? backend.persistUnpublishedEntry
      : backend.persistEntry;
    const persistCallArgs = [
      backend,
      state.config,
      collection,
      serializedEntryDraft,
      assetProxies.toJS(),
      state.integrations,
      usedSlugs,
    ];

    try {
      const newSlug = await persistAction.call(...persistCallArgs);
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.entrySaved',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
      dispatch(unpublishedEntryPersisted(collection, serializedEntry, transactionID, newSlug));
    } catch (error) {
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.onFailToPersist',
            details: error,
          },
          kind: 'danger',
          dismissAfter: 8000,
        }),
      );
      return Promise.reject(dispatch(unpublishedEntryPersistedFail(error, transactionID)));
    }
  };
}

export function updateUnpublishedEntryStatus(collection, slug, oldStatus, newStatus) {
  return (dispatch, getState) => {
    if (oldStatus === newStatus) return;
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    dispatch(
      unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID),
    );
    backend
      .updateUnpublishedEntryStatus(collection, slug, newStatus)
      .then(() => {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.entryUpdated',
            },
            kind: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(
          unpublishedEntryStatusChangePersisted(
            collection,
            slug,
            oldStatus,
            newStatus,
            transactionID,
          ),
        );
      })
      .catch(error => {
        dispatch(
          notifSend({
            message: {
              key: 'ui.toast.onFailToUpdateStatus',
              details: error,
            },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryStatusChangeError(collection, slug, transactionID));
      });
  };
}

export function deleteUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    dispatch(unpublishedEntryDeleteRequest(collection, slug, transactionID));
    return backend
      .deleteUnpublishedEntry(collection, slug)
      .then(() => {
        dispatch(
          notifSend({
            message: { key: 'ui.toast.onDeleteUnpublishedChanges' },
            kind: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(unpublishedEntryDeleted(collection, slug, transactionID));
      })
      .catch(error => {
        dispatch(
          notifSend({
            message: { key: 'ui.toast.onDeleteUnpublishedChanges', details: error },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryDeleteError(collection, slug, transactionID));
      });
  };
}

export function publishUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const collections = state.collections;
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID));
    return backend
      .publishUnpublishedEntry(collection, slug)
      .then(({ mediaFiles }) => {
        dispatch(
          notifSend({
            message: { key: 'ui.toast.entryPublished' },
            kind: 'success',
            dismissAfter: 4000,
          }),
        );

        dispatch(unpublishedEntryPublished(collection, slug, transactionID));
        dispatch(loadEntry(collections.get(collection), slug));

        dispatch(addMediaFilesToLibrary(mediaFiles.map(file => ({ ...file, draft: false }))));
        dispatch(clearDraftEntryMediaFiles());
      })
      .catch(error => {
        dispatch(
          notifSend({
            message: { key: 'ui.toast.onFailToPublishEntry', details: error },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryPublishError(collection, slug, transactionID));
      });
  };
}

export function unpublishPublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid();
    const entry = selectEntry(state, collection.get('name'), slug);
    const entryDraft = Map().set('entry', entry);
    dispatch(unpublishedEntryPersisting(collection, entry, transactionID));
    return backend
      .deleteEntry(state.config, collection, slug)
      .then(() =>
        backend.persistEntry(state.config, collection, entryDraft, [], state.integrations, [], {
          status: status.get('PENDING_PUBLISH'),
        }),
      )
      .then(() => {
        dispatch(unpublishedEntryPersisted(collection, entryDraft, transactionID, slug));
        dispatch(entryDeleted(collection, slug));
        dispatch(loadUnpublishedEntry(collection, slug));
        dispatch(
          notifSend({
            message: { key: 'ui.toast.entryUnpublished' },
            kind: 'success',
            dismissAfter: 4000,
          }),
        );
      })
      .catch(error => {
        dispatch(
          notifSend({
            message: { key: 'ui.toast.onFailToUnpublishEntry', details: error },
            kind: 'danger',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryPersistedFail(error, transactionID));
      });
  };
}
