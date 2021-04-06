import { List } from 'immutable';
import auth from './auth';
import config from './config';
import integrations, * as fromIntegrations from './integrations';
import entries, * as fromEntries from './entries';
import cursors from './cursors';
import editorialWorkflow, * as fromEditorialWorkflow from './editorialWorkflow';
import entryDraft from './entryDraft';
import collections from './collections';
import search from './search';
import medias from './medias';
import mediaLibrary from './mediaLibrary';
import deploys, * as fromDeploys from './deploys';
import globalUI from './globalUI';
import status from './status';
import { Status } from '../constants/publishModes';
import { State, Collection } from '../types/redux';

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
};

export default reducers;

/*
 * Selectors
 */
export function selectEntry(state: State, collection: string, slug: string) {
  return fromEntries.selectEntry(state.entries, collection, slug);
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

export function selectIntegration(state: State, collection: string | null, hook: string) {
  return fromIntegrations.selectIntegration(state.integrations, collection, hook);
}
