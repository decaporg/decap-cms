import { localForage } from 'netlify-cms-lib-util';
import { v1 as uuidv1 } from 'uuid';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
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
import { createDraftFromEntry } from '../actions/entries';

export const HISTORY_REQUEST = 'HISTORY_REQUEST';
export const HISTORY_SUCCESS = 'HISTORY_SUCCESS';
export const HISTORY_FAILURE = 'HISTORY_FAILURE';

export const ADD_HISTORY_ITEM_REQUEST = 'ADD_HISTORY_ITEM_REQUEST';
export const ADD_HISTORY_ITEM_SUCCESS = 'ADD_HISTORY_ITEM_SUCCESS';
export const ADD_HISTORY_ITEM_FAILURE = 'ADD_HISTORY_ITEM_FAILURE';

export const REMOVE_HISTORY_ITEM_REQUEST = 'REMOVE_HISTORY_ITEM_REQUEST';
export const REMOVE_HISTORY_ITEM_SUCCESS = 'REMOVE_HISTORY_ITEM_SUCCESS';
export const REMOVE_HISTORY_ITEM_FAILURE = 'REMOVE_HISTORY_ITEM_FAILURE';

const getHistoryKey = (collection: string, slug: string) => `cms.history.${collection}.${slug}`;

export function loadHistoryRequest(collection: string, slug: string) {
  return { type: HISTORY_REQUEST, payload: { collection, slug } };
}

export function loadHistorySuccess(collection: string, slug: string, history: EntryHistory) {
  return { type: HISTORY_SUCCESS, payload: { collection, slug, history } };
}

export function loadHistoryFailure(collection: string, slug: string, error: Error) {
  return { type: HISTORY_FAILURE, payload: { collection, slug, error } };
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

const tryLoadHistory = async (collection: string, slug: string) => {
  const key = getHistoryKey(collection, slug);
  const history = (await localForage.getItem<EntryHistory>(key)) || { items: [] };
  return history;
};

const trySaveHistory = async (collection: string, slug: string, history: EntryHistory) => {
  const key = getHistoryKey(collection, slug);
  await localForage.setItem<EntryHistory>(key, history);
  return history;
};

export function loadHistory(collection: Collection, entry: EntryMap) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>) => {
    const collectionName = collection.get('name');
    const slug = entry.get('slug') || '';

    try {
      dispatch(loadHistoryRequest(collectionName, slug));
      const history = await tryLoadHistory(collectionName, slug);
      dispatch(loadHistorySuccess(collectionName, slug, history));
    } catch (error) {
      dispatch(loadHistoryFailure(collectionName, slug, error));
    }
  };
}

const tryAddItemToHistory = async (
  backend: Backend,
  collection: Collection,
  entry: EntryMap,
  origin: HistoryItemOrigin,
  collectionName: string,
  slug: string,
) => {
  const history = await tryLoadHistory(collectionName, slug);
  const raw = backend.entryToRaw(collection, entry);
  if (history.items.length > 0 && history.items[0].raw === raw) {
    return history;
  }
  const historyItem: HistoryItem = {
    id: uuidv1(),
    raw,
    slug,
    path: entry.get('path'),
    timestamp: Date.now(),
    origin,
    collection: collectionName,
  };

  const newHistory = await trySaveHistory(collectionName, slug, {
    ...history,
    items: [historyItem, ...history.items],
  });
  return newHistory;
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
      const backend: Backend = currentBackend(state.config);
      dispatch(addHistoryItemRequest(collectionName, slug));
      const newHistory = await tryAddItemToHistory(
        backend,
        collection,
        entry,
        origin,
        collectionName,
        slug,
      );
      dispatch(addHistoryItemSuccess(collectionName, slug, newHistory));
    } catch (error) {
      dispatch(addHistoryItemFailure(collectionName, slug, error));
    }
  };
}

export function loadHistoryItem(collection: Collection, entry: EntryMap, item: HistoryItem) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const collectionName = collection.get('name');
    const slug = entry.get('slug') || '';

    try {
      const state = getState();
      const backend: Backend = currentBackend(state.config);
      const label = selectFileEntryLabel(collection, entry.get('slug'));
      let loadedEntry = createEntry(collectionName, slug, item.path, {
        raw: item.raw,
        label,
        mediaFiles: [],
      });
      loadedEntry = backend.entryWithFormat(collection)(loadedEntry);
      loadedEntry = await backend.processEntry(state, collection, loadedEntry);
      dispatch(createDraftFromEntry(loadedEntry));
    } catch (e) {
      console.log(e);
    }
  };
}

const tryRemoveItemFromHistory = async (
  collectionName: string,
  slug: string,
  item: HistoryItem,
) => {
  const history = await tryLoadHistory(collectionName, slug);
  const newHistory = await trySaveHistory(collectionName, slug, {
    ...history,
    items: history.items.filter(i => i.id !== item.id),
  });
  return newHistory;
};

export function removeHistoryItem(collection: Collection, entry: EntryMap, item: HistoryItem) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>) => {
    const collectionName = collection.get('name');
    const slug = entry.get('slug') || '';

    try {
      dispatch(removeHistoryItemRequest(collectionName, slug));
      const newHistory = await tryRemoveItemFromHistory(collectionName, slug, item);
      dispatch(removeHistoryItemSuccess(collectionName, slug, newHistory));
    } catch (error) {
      dispatch(removeHistoryItemFailure(collectionName, slug, error));
    }
  };
}
