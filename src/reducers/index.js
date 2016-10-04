import auth from './auth';
import config, * as fromConfig from './config';
import editor from './editor';
import entries, * as fromEntries  from './entries';
import editorialWorkflow, * as fromEditorialWorkflow  from './editorialWorkflow';
import entryDraft from './entryDraft';
import collections, * as fromCollections from './collections';
import medias, * as fromMedias from './medias';

const reducers = {
  auth,
  config,
  collections,
  editor,
  entries,
  editorialWorkflow,
  entryDraft,
  medias
};

export default reducers;

/*
 * Selectors
 */
export const selectEntry = (state, collection, slug) =>
  fromEntries.selectEntry(state.entries, collection, slug);

export const selectEntries = (state, collection) =>
  fromEntries.selectEntries(state.entries, collection);

export const selectSearchedEntries = (state) =>
  fromEntries.selectSearchedEntries(state.entries);

export const selectUnpublishedEntry = (state, status, slug) =>
  fromEditorialWorkflow.selectUnpublishedEntry(state.editorialWorkflow, status, slug);

export const selectUnpublishedEntries = (state, status) =>
  fromEditorialWorkflow.selectUnpublishedEntries(state.editorialWorkflow, status);

export const selectCollection = (state, name) =>
  fromCollections.selectCollection(state.collections, name);

export const hasSearchIntegration = (state) =>
  fromConfig.hasSearchIntegration(state.config);

export const useSearchForListing = (state) =>
  fromConfig.useSearchForListing(state.config);

export const getMedia = (state, path) =>
  fromMedias.getMedia(state.medias, path);
