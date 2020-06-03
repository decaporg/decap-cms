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
export const selectEntry = (state: State, collection: string, slug: string) =>
  fromEntries.selectEntry(state.entries, collection, slug);

export const selectEntries = (state: State, collection: Collection) =>
  fromEntries.selectEntries(state.entries, collection);

export const selectPublishedSlugs = (state: State, collection: string) =>
  fromEntries.selectPublishedSlugs(state.entries, collection);

export const selectSearchedEntries = (state: State, availableCollections: string[]) => {
  const searchItems = state.search.get('entryIds');
  // only return search results for actually available collections
  return (
    searchItems &&
    searchItems
      .filter(({ collection }) => availableCollections.indexOf(collection) !== -1)
      .map(({ collection, slug }) => fromEntries.selectEntry(state.entries, collection, slug))
  );
};

export const selectDeployPreview = (state: State, collection: string, slug: string) =>
  fromDeploys.selectDeployPreview(state.deploys, collection, slug);

export const selectUnpublishedEntry = (state: State, collection: string, slug: string) =>
  fromEditorialWorkflow.selectUnpublishedEntry(state.editorialWorkflow, collection, slug);

export const selectUnpublishedEntriesByStatus = (state: State, status: Status) =>
  fromEditorialWorkflow.selectUnpublishedEntriesByStatus(state.editorialWorkflow, status);

export const selectUnpublishedSlugs = (state: State, collection: string) =>
  fromEditorialWorkflow.selectUnpublishedSlugs(state.editorialWorkflow, collection);

export const selectIntegration = (state: State, collection: string | null, hook: string) =>
  fromIntegrations.selectIntegration(state.integrations, collection, hook);
