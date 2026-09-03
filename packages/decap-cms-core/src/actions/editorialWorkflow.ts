import get from 'lodash/get';
import { Map, List } from 'immutable';
import { EDITORIAL_WORKFLOW_ERROR, generateContentKey } from 'decap-cms-lib-util';

import { currentBackend, slugFromCustomPath } from '../backend';
import {
  selectPublishedSlugs,
  selectUnpublishedSlugs,
  selectEntry,
  selectUnpublishedEntry,
} from '../reducers';
import { selectEditingDraft } from '../reducers/entries';
import { EDITORIAL_WORKFLOW, status } from '../constants/publishModes';
import {
  loadEntry,
  entryDeleted,
  getMediaAssets,
  createDraftFromEntry,
  loadEntries,
  getSerializedEntry,
} from './entries';
import { createAssetProxy } from '../valueObjects/AssetProxy';
import { addAssets } from './media';
import { loadMedia } from './mediaLibrary';
import ValidationErrorTypes from '../constants/validationErrorTypes';
import { navigateToEntry } from '../routing/history';
import { addNotification } from './notifications';

import type {
  Collection,
  EntryMap,
  State,
  Collections,
  EntryDraft,
  MediaFile,
} from '../types/redux';
import type { AnyAction } from 'redux';
import type { EntryValue } from '../valueObjects/Entry';
import type { Status } from '../constants/publishModes';
import type { ThunkDispatch } from 'redux-thunk';

/*
 * Constant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
export const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

/** Which entries are under editorial workflow, without loading any of them. */
export const UNPUBLISHED_KEYS_SUCCESS = 'UNPUBLISHED_KEYS_SUCCESS';

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

/**
 * The identities of the entries under editorial workflow, with none of their
 * contents. This is all `loadUnpublishedEntry` needs to know whether a slug is
 * in the workflow, and it costs one request where loading the entries costs one
 * per entry on top of it.
 */
function unpublishedKeysLoaded(keys: string[]) {
  return {
    type: UNPUBLISHED_KEYS_SUCCESS,
    payload: { keys },
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

/**
 * How long the set of workflow entry keys may be reused as proof that a given
 * slug is NOT under editorial workflow. Short enough that a colleague's new
 * draft is noticed within one navigation or two, long enough that browsing a
 * collection does not refetch per entry opened.
 */
const UNPUBLISHED_LIST_MAX_AGE = 30 * 1000;

export function loadUnpublishedEntry(collection: Collection, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const keys = state.editorialWorkflow.getIn(['pages', 'keys']) as List<string> | undefined;
    const loadedAt = (state.editorialWorkflow.getIn(['pages', 'loadedAt']) as number) ?? 0;
    // The key set is only ever fetched once per page load —
    // loadUnpublishedEntries early-returns while `pages.ids` is set, and
    // nothing clears it after CONFIG_SUCCESS. So without a freshness window
    // the shortcut below would answer "not under editorial workflow" from a
    // snapshot taken when the session started, which is wrong the moment a
    // COLLEAGUE creates a draft: the entry opens as the published version with
    // no workflow bar, and saving it takes the `!unpublished` path, calls
    // createBranch on the `cms/...` branch that already exists, and 422s.
    // Editorial workflow exists for multi-editor use, so that is the ordinary
    // case, not an edge.
    //
    // What gets refreshed is the KEY SET, not the entries. Proving a slug is
    // absent needs identities only, and `backend.unpublishedContentKeys` is
    // the one request that lists them; `backend.unpublishedEntries` answers
    // the same question but then hydrates every draft it found — a pull
    // request lookup, a diff and a blob read each — which measured 20 requests
    // and 3.1s through Turbo's proxy, in front of an entry load that had not
    // started yet.
    const keysAreStale = !keys || Date.now() - loadedAt > UNPUBLISHED_LIST_MAX_AGE;
    if (keysAreStale) {
      try {
        dispatch(unpublishedKeysLoaded(await backend.unpublishedContentKeys()));
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    // `backend.unpublishedEntry` re-derives, for this one slug, the same
    // open-pull-request set the keys above already describe. So when the keys
    // are known and this entry is not among them, the answer is already there
    // — the entry is not under editorial workflow — and asking again costs a
    // full round trip before the editor can even begin loading the published
    // entry. Measured through Turbo's proxy at 2.4s, paid on every open of
    // every published entry, which is the common case.
    //
    // The key set is kept current locally as this session works: persisting
    // adds the key, publishing and deleting remove it. A draft another editor
    // created is picked up by the staleness refresh above, which is what makes
    // "absent from the keys" safe to treat as "not under editorial workflow".
    //
    // Read from a fresh getState(), because the refresh above may have just
    // populated it.
    //
    // Gated on `loadedAt` rather than on the keys being present, because the
    // local bookkeeping creates the key set too: persisting into an empty
    // state adds one key, publishing out of it leaves an empty list, and
    // neither has asked the backend anything. Taking an unconfirmed set as
    // proof of absence would send every other entry down the published path.
    // A refresh that threw therefore falls through to the slower per-slug
    // lookup below, which is the safe direction.
    const loadedState = getState();
    const confirmedAt = loadedState.editorialWorkflow.getIn(['pages', 'loadedAt']) as
      | number
      | undefined;
    const currentKeys = loadedState.editorialWorkflow.getIn(['pages', 'keys']) as
      | List<string>
      | undefined;
    const isKnownUnpublished = Boolean(
      currentKeys?.includes(generateContentKey(collection.get('name') as string, slug)),
    );

    if (confirmedAt && currentKeys && !isKnownUnpublished) {
      // Exactly what the notUnderEditorialWorkflow branch below does.
      dispatch(unpublishedEntryRedirected(collection, slug));
      dispatch(loadEntry(collection, slug));
      return;
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
    } catch (error) {
      if (error.name === EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            type: 'error',
            dismissAfter: 8000,
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
    const entriesLoading = get(state.editorialWorkflow.toJS(), 'pages.isFetching', false);

    if (state.config.publish_mode !== EDITORIAL_WORKFLOW || entriesLoaded || entriesLoading) {
      return;
    }

    dispatch(unpublishedEntriesLoading());
    backend
      .unpublishedEntries(collections)
      .then(response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)))
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            type: 'error',
            dismissAfter: 8000,
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
          addNotification({
            message: {
              key: 'ui.toast.missingRequiredField',
            },
            type: 'error',
            dismissAfter: 8000,
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
        addNotification({
          message: {
            key: 'ui.toast.entrySaved',
          },
          type: 'success',
          dismissAfter: 4000,
        }),
      );
      dispatch(unpublishedEntryPersisted(collection, serializedEntry));

      if (entry.get('slug') !== newSlug) {
        await dispatch(loadUnpublishedEntry(collection, newSlug));
        navigateToEntry(collection.get('name'), newSlug);
      }
    } catch (error) {
      dispatch(
        addNotification({
          message: {
            key: 'ui.toast.onFailToPersist',
            details: error,
          },
          type: 'error',
          dismissAfter: 8000,
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
          addNotification({
            message: {
              key: 'ui.toast.entryUpdated',
            },
            type: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(unpublishedEntryStatusChangePersisted(collection, slug, newStatus));
      })
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.onFailToUpdateStatus',
              details: error,
            },
            type: 'error',
            dismissAfter: 8000,
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
          addNotification({
            message: { key: 'ui.toast.onDeleteUnpublishedChanges' },
            type: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(unpublishedEntryDeleted(collection, slug));
      })
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: { key: 'ui.toast.onDeleteUnpublishedChanges', details: error },
            type: 'error',
            dismissAfter: 8000,
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
        addNotification({
          message: { key: 'ui.toast.entryPublished' },
          type: 'success',
          dismissAfter: 4000,
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
        addNotification({
          message: { key: 'ui.toast.onFailToPublishEntry', details: error },
          type: 'error',
          dismissAfter: 8000,
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
      .then(() => backend.reopenIssueForUnpublishedEntry(collection.get('name'), slug))
      .then(() => {
        dispatch(unpublishedEntryPersisted(collection, entry));
        dispatch(entryDeleted(collection, slug));
        dispatch(loadUnpublishedEntry(collection, slug));
        dispatch(
          addNotification({
            message: { key: 'ui.toast.entryUnpublished' },
            type: 'success',
            dismissAfter: 4000,
          }),
        );
      })
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: { key: 'ui.toast.onFailToUnpublishEntry', details: error },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug')));
      });
  };
}
