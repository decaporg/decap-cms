import auth from './auth';
import config from './config';
import integrations, * as fromIntegrations from './integrations';
import entries, * as fromEntries from './entries';
import cursors from './cursors';
import editorialWorkflow, * as fromEditorialWorkflow from './editorialWorkflow';
import entryDraft from './entryDraft';
import collections from './collections';
import search from './search';
import mediaLibrary from './mediaLibrary';
import medias, * as fromMedias from './medias';
import globalUI from './globalUI';

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
  mediaLibrary,
  medias,
  globalUI,
};

export default reducers;

/*
 * Selectors
 */
export const selectEntry = (state, collection, slug) =>
  fromEntries.selectEntry(state.entries, collection, slug);

export const selectEntries = (state, collection) =>
  fromEntries.selectEntries(state.entries, collection);

export const selectSearchedEntries = (state) => {
  const searchItems = state.search.get('entryIds');
  return searchItems && searchItems.map(({ collection, slug }) => fromEntries.selectEntry(state.entries, collection, slug));
};

export const selectUnpublishedEntry = (state, collection, slug) =>
  fromEditorialWorkflow.selectUnpublishedEntry(state.editorialWorkflow, collection, slug);

export const selectUnpublishedEntriesByStatus = (state, status) =>
  fromEditorialWorkflow.selectUnpublishedEntriesByStatus(state.editorialWorkflow, status);

export const selectIntegration = (state, collection, hook) =>
  fromIntegrations.selectIntegration(state.integrations, collection, hook);

export const getAsset = (state, path) =>
  fromMedias.getAsset(state.config.get('public_folder'), state.medias, path);
