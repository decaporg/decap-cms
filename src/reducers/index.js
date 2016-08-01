import auth from './auth';
import config from './config';
import entries, * as fromEntries  from './entries';
import entryDraft from './entryDraft';
import collections from './collections';
import medias, * as fromMedias from './medias';

const reducers = {
  auth,
  config,
  collections,
  entries,
  entryDraft,
  medias
};

export default reducers;

export const selectEntry = (state, collection, slug) =>
  fromEntries.selectEntry(state.entries, collection, slug);


export const selectEntries = (state, collection) =>
  fromEntries.selectEntries(state.entries, collection);

export const getMedia = (state, path) =>
  fromMedias.getMedia(state.medias, path);
