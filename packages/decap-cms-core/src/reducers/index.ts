import { List } from 'immutable';

import auth from './auth';
import config from './config';
import collections, * as fromCollections from './collections';
import integrations, * as fromIntegrations from './integrations';
import entries, * as fromEntries from './entries';
import cursors from './cursors';
import editorialWorkflow, * as fromEditorialWorkflow from './editorialWorkflow';
import entryDraft from './entryDraft';
import medias from './medias';
import mediaLibrary from './mediaLibrary';
import deploys, * as fromDeploys from './deploys';
import globalUI from './globalUI';
import search from './search';
import status from './status';
import notifications from './notifications';
import { FOLDER } from '../constants/collectionTypes';

import type { Status } from '../constants/publishModes';
import type { State, Collection } from '../types/redux';

const reducers = {
  auth,
  config,
  collections,
  search,
  integrations,
  entries,
  cursors,
  editorialWorkflow,
  entryDraft,
  medias,
  mediaLibrary,
  deploys,
  globalUI,
  status,
  notifications,
};

export default reducers;

/*
 * Selectors
 */
export function selectEntry(state: State, collectionName: string, slug: string) {
  return fromEntries.selectEntry(state.entries, collectionName, slug);
}

export function selectEntries(state: State, collection: Collection) {
  return fromEntries.selectEntries(state.entries, collection);
}

export function selectPublishedSlugs(state: State, collection: string) {
  return fromEntries.selectPublishedSlugs(state.entries, collection);
}

export function selectSearchedEntries(state: State, availableCollections: string[]) {
  // only return search results for actually available collections
  return List(state.search.entryIds)
    .filter(entryId => availableCollections.indexOf(entryId!.collection) !== -1)
    .map(entryId => fromEntries.selectEntry(state.entries, entryId!.collection, entryId!.slug));
}

export function selectDeployPreview(state: State, collection: string, slug: string) {
  return fromDeploys.selectDeployPreview(state.deploys, collection, slug);
}

export function selectUnpublishedEntry(state: State, collection: string, slug: string) {
  return fromEditorialWorkflow.selectUnpublishedEntry(state.editorialWorkflow, collection, slug);
}

export function selectUnpublishedEntriesByStatus(state: State, status: Status) {
  return fromEditorialWorkflow.selectUnpublishedEntriesByStatus(state.editorialWorkflow, status);
}

export function selectUnpublishedSlugs(state: State, collection: string) {
  return fromEditorialWorkflow.selectUnpublishedSlugs(state.editorialWorkflow, collection);
}

export function selectCanCreateNewEntry(state: State, collectionName: string) {
  const collection = state.collections.get(collectionName);

  if (!collection || !collection.get('create')) {
    return false;
  }

  if (collection.get('type') !== FOLDER) {
    return fromCollections.selectAllowNewEntries(collection);
  }

  const limit = collection.get('limit') as number | undefined;

  if (limit === undefined || limit === null) {
    return true;
  }

  const entries = fromEntries.selectEntries(state.entries, collection);
  const entryCount = entries ? entries.size : 0;

  return entryCount < limit;
}

export function selectIntegration(state: State, collection: string | null, hook: string) {
  return fromIntegrations.selectIntegration(state.integrations, collection, hook);
}
