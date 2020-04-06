import { localForage } from 'netlify-cms-lib-util';
import { v1 as uuidv1 } from 'uuid';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { isEqual } from 'lodash';
import { Map } from 'immutable';
import { currentBackend, Backend } from '../backend';
import {
  Collection,
  EntryMap,
  State,
  EntryHistory,
  HistoryItem,
  HistoryItemOrigin,
} from '../types/redux';
import { createEntry } from '../valueObjects/Entry';
import { selectFileEntryLabel } from '../reducers/collections';
import { createDraftFromHistory } from '../actions/entries';

export const HISTORY_REQUEST = 'HISTORY_REQUEST';
export const HISTORY_SUCCESS = 'HISTORY_SUCCESS';
export const HISTORY_FAILURE = 'HISTORY_FAILURE';

export const HISTORY_ITEM_REQUEST = 'LOAD_HISTORY_ITEM_REQUEST';
export const HISTORY_ITEM_SUCCESS = 'LOAD_HISTORY_ITEM_SUCCESS';
export const HISTORY_ITEM_FAILURE = 'LOAD_HISTORY_ITEM_FAILURE';

export const ADD_HISTORY_ITEM_REQUEST = 'ADD_HISTORY_ITEM_REQUEST';
export const ADD_HISTORY_ITEM_SUCCESS = 'ADD_HISTORY_ITEM_SUCCESS';
export const ADD_HISTORY_ITEM_FAILURE = 'ADD_HISTORY_ITEM_FAILURE';

export const REMOVE_HISTORY_ITEM_REQUEST = 'REMOVE_HISTORY_ITEM_REQUEST';
export const REMOVE_HISTORY_ITEM_SUCCESS = 'REMOVE_HISTORY_ITEM_SUCCESS';
export const REMOVE_HISTORY_ITEM_FAILURE = 'REMOVE_HISTORY_ITEM_FAILURE';

const getBackupKey = (collection: string, slug: string) => `cms.history.${collection}.${slug}`;

type BackupItem = {
  id: string;
  raw: string;
  timestamp: number;
  path: string;
  slug: string;
  collection: string;
  origin: HistoryItemOrigin;
};

type EntryBackup = {
  items: BackupItem[];
};

export function loadHistoryRequest(collection: string, slug: string) {
  return { type: HISTORY_REQUEST, payload: { collection, slug } };
}

export function loadHistorySuccess(collection: string, slug: string, history: EntryHistory) {
  return { type: HISTORY_SUCCESS, payload: { collection, slug, history } };
}

export function loadHistoryFailure(collection: string, slug: string, error: Error) {
  return { type: HISTORY_FAILURE, payload: { collection, slug, error } };
}

export function loadHistoryItemRequest(collection: string, slug: string, item: HistoryItem) {
  return { type: HISTORY_ITEM_REQUEST, payload: { collection, slug, item } };
}

export function loadHistoryItemSuccess(collection: string, slug: string, item: HistoryItem) {
  return { type: HISTORY_ITEM_SUCCESS, payload: { collection, slug, item } };
}

export function loadHistoryItemFailure(
  collection: string,
  slug: string,
  item: HistoryItem,
  error: Error,
) {
  return { type: HISTORY_ITEM_FAILURE, payload: { collection, slug, item, error } };
}

export function addHistoryItemRequest(collection: string, slug: string) {
  return { type: ADD_HISTORY_ITEM_REQUEST, payload: { collection, slug } };
}

export function addHistoryItemSuccess(collection: string, slug: string, history: EntryHistory) {
  return { type: ADD_HISTORY_ITEM_SUCCESS, payload: { collection, slug, history } };
}

export function addHistoryItemFailure(collection: string, slug: string, error: Error) {
  return { type: ADD_HISTORY_ITEM_FAILURE, payload: { collection, slug, error } };
}

export function removeHistoryItemRequest(collection: string, slug: string) {
  return { type: REMOVE_HISTORY_ITEM_REQUEST, payload: { collection, slug } };
}

export function removeHistoryItemSuccess(collection: string, slug: string, history: EntryHistory) {
  return { type: REMOVE_HISTORY_ITEM_SUCCESS, payload: { collection, slug, history } };
}

export function removeHistoryItemFailure(collection: string, slug: string, error: Error) {
  return { type: REMOVE_HISTORY_ITEM_FAILURE, payload: { collection, slug, error } };
}

const backupItemToHistoryItem = (
  state: State,
  collection: Collection,
  slug: string,
  item: BackupItem,
): HistoryItem => {
  const collectionName = collection.get('name');
  const backend: Backend = currentBackend(state.config);
  let newEntry = createEntry(collectionName, slug, item.path, {
    raw: item.raw,
  });
  newEntry = backend.entryWithFormat(collection)(newEntry);

  return {
    id: item.id,
    collection: item.collection,
    origin: item.origin,
    path: item.path,
    slug: item.slug,
    timestamp: item.timestamp,
    data: newEntry.data,
  };
};

const tryLoadBackup = async (collection: string, slug: string) => {
  const key = getBackupKey(collection, slug);
  const backup = (await localForage.getItem<EntryBackup>(key)) || { items: [] };

  return backup;
};

const trySaveBackup = async (collection: string, slug: string, backup: EntryBackup) => {
  const key = getBackupKey(collection, slug);
  await localForage.setItem<EntryBackup>(key, backup);
  return backup;
};

export function loadHistory(collection: Collection, entry: EntryMap) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const collectionName = collection.get('name');
    const slug = entry.get('slug') || '';

    try {
      const state = getState();
      dispatch(loadHistoryRequest(collectionName, slug));
      const backup = await tryLoadBackup(collectionName, slug);
      dispatch(
        loadHistorySuccess(collectionName, slug, {
          ...backup,
          items: backup.items.map(item => backupItemToHistoryItem(state, collection, slug, item)),
        }),
      );
    } catch (error) {
      dispatch(loadHistoryFailure(collectionName, slug, error));
    }
  };
}

const historyItemToEntry = async (
  state: State,
  collection: Collection,
  slug: string,
  item: HistoryItem,
) => {
  const collectionName = collection.get('name');
  const backend: Backend = currentBackend(state.config);
  const label = selectFileEntryLabel(collection, slug);
  let newEntry = createEntry(collectionName, slug, item.path, {
    data: item.data,
    label,
    mediaFiles: [],
  });
  newEntry = await backend.processEntry(state, collection, newEntry);

  return newEntry;
};

const isEntryEqualHistoryItem = (entry: EntryMap, item: HistoryItem) => {
  const entryData = entry.get('data');
  return Map.isMap(entryData) && isEqual(entryData.toJS(), item.data);
};

const tryAddItemToBackup = async (
  state: State,
  collection: Collection,
  entry: EntryMap,
  origin: HistoryItemOrigin,
  collectionName: string,
  slug: string,
) => {
  const backup = await tryLoadBackup(collectionName, slug);
  if (
    // skip backup for identical entries at the top of the stack
    backup.items.length > 0 &&
    isEntryEqualHistoryItem(
      entry,
      backupItemToHistoryItem(state, collection, slug, backup.items[0]),
    )
  ) {
    return backup;
  }
  const backend: Backend = currentBackend(state.config);
  const backupItem: BackupItem = {
    id: uuidv1(),
    raw: backend.entryToRaw(collection, entry),
    slug,
    path: entry.get('path'),
    timestamp: Date.now(),
    origin,
    collection: collectionName,
  };

  const newBackup = await trySaveBackup(collectionName, slug, {
    ...backup,
    items: [backupItem, ...backup.items],
  });
  return newBackup;
};

export function addToHistory(
  collection: Collection,
  entry: EntryMap,
  origin = HistoryItemOrigin.Local,
) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const collectionName = collection.get('name');
    const slug = entry.get('slug') || '';

    try {
      const state = getState();
      dispatch(addHistoryItemRequest(collectionName, slug));
      const newBackup = await tryAddItemToBackup(
        state,
        collection,
        entry,
        origin,
        collectionName,
        slug,
      );
      dispatch(
        addHistoryItemSuccess(collectionName, slug, {
          ...newBackup,
          items: newBackup.items.map(item =>
            backupItemToHistoryItem(state, collection, slug, item),
          ),
        }),
      );
    } catch (error) {
      dispatch(addHistoryItemFailure(collectionName, slug, error));
    }
  };
}

export function loadHistoryItem(
  collection: Collection,
  entry: EntryMap | undefined,
  item: HistoryItem,
) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const collectionName = collection.get('name');
    const slug = entry?.get('slug') || '';

    try {
      const state = getState();
      dispatch(loadHistoryItemRequest(collectionName, slug, item));
      const newEntry = await historyItemToEntry(state, collection, slug, item);
      dispatch(createDraftFromHistory(entry, newEntry));
      dispatch(loadHistoryItemSuccess(collectionName, slug, item));
    } catch (e) {
      console.log(e);
      dispatch(loadHistoryItemFailure(collectionName, slug, item, e));
    }
  };
}

const tryRemoveItemFromBackup = async (collectionName: string, slug: string, item: HistoryItem) => {
  const backup = await tryLoadBackup(collectionName, slug);
  const newBackup = await trySaveBackup(collectionName, slug, {
    ...backup,
    items: backup.items.filter(i => i.id !== item.id),
  });
  return newBackup;
};

export function removeHistoryItem(collection: Collection, entry: EntryMap, item: HistoryItem) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const collectionName = collection.get('name');
    const slug = entry.get('slug') || '';

    try {
      const state = getState();
      dispatch(removeHistoryItemRequest(collectionName, slug));
      const newBackup = await tryRemoveItemFromBackup(collectionName, slug, item);
      dispatch(
        removeHistoryItemSuccess(collectionName, slug, {
          ...newBackup,
          items: newBackup.items.map(item =>
            backupItemToHistoryItem(state, collection, slug, item),
          ),
        }),
      );
    } catch (error) {
      dispatch(removeHistoryItemFailure(collectionName, slug, error));
    }
  };
}
