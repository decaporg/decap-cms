import { Map, List, fromJS } from 'immutable';
import { dirname, join } from 'path';
import {
  ENTRY_REQUEST,
  ENTRY_SUCCESS,
  ENTRY_FAILURE,
  ENTRIES_REQUEST,
  ENTRIES_SUCCESS,
  ENTRIES_FAILURE,
  ENTRY_DELETE_SUCCESS,
} from '../actions/entries';
import { SEARCH_ENTRIES_SUCCESS } from '../actions/search';
import {
  EntriesAction,
  EntryRequestPayload,
  EntrySuccessPayload,
  EntriesSuccessPayload,
  EntryObject,
  Entries,
  Config,
  Collection,
  EntryFailurePayload,
  EntryDeletePayload,
  EntriesRequestPayload,
  EntryDraft,
  EntryMap,
} from '../types/redux';
import { folderFormatter } from '../lib/formatters';
import { isAbsolutePath, basename } from 'netlify-cms-lib-util';

let collection: string;
let loadedEntries: EntryObject[];
let append: boolean;
let page: number;
let slug: string;

const entries = (state = Map({ entities: Map(), pages: Map() }), action: EntriesAction) => {
  switch (action.type) {
    case ENTRY_REQUEST: {
      const payload = action.payload as EntryRequestPayload;
      return state.setIn(['entities', `${payload.collection}.${payload.slug}`, 'isFetching'], true);
    }

    case ENTRY_SUCCESS: {
      const payload = action.payload as EntrySuccessPayload;
      collection = payload.collection;
      slug = payload.entry.slug;
      return state.withMutations(map => {
        map.setIn(['entities', `${collection}.${slug}`], fromJS(payload.entry));
        const ids = map.getIn(['pages', collection, 'ids'], List());
        if (!ids.includes(slug)) {
          map.setIn(['pages', collection, 'ids'], ids.unshift(slug));
        }
      });
    }

    case ENTRIES_REQUEST: {
      const payload = action.payload as EntriesRequestPayload;
      return state.setIn(['pages', payload.collection, 'isFetching'], true);
    }

    case ENTRIES_SUCCESS: {
      const payload = action.payload as EntriesSuccessPayload;
      collection = payload.collection;
      loadedEntries = payload.entries;
      append = payload.append;
      page = payload.page;
      return state.withMutations(map => {
        loadedEntries.forEach(entry =>
          map.setIn(
            ['entities', `${collection}.${entry.slug}`],
            fromJS(entry).set('isFetching', false),
          ),
        );

        const ids = List(loadedEntries.map(entry => entry.slug));
        map.setIn(
          ['pages', collection],
          Map({
            page,
            ids: append ? map.getIn(['pages', collection, 'ids'], List()).concat(ids) : ids,
          }),
        );
      });
    }
    case ENTRIES_FAILURE:
      return state.setIn(['pages', action.meta.collection, 'isFetching'], false);

    case ENTRY_FAILURE: {
      const payload = action.payload as EntryFailurePayload;
      return state.withMutations(map => {
        map.setIn(['entities', `${payload.collection}.${payload.slug}`, 'isFetching'], false);
        map.setIn(
          ['entities', `${payload.collection}.${payload.slug}`, 'error'],
          payload.error.message,
        );
      });
    }

    case SEARCH_ENTRIES_SUCCESS: {
      const payload = action.payload as EntriesSuccessPayload;
      loadedEntries = payload.entries;
      return state.withMutations(map => {
        loadedEntries.forEach(entry =>
          map.setIn(
            ['entities', `${entry.collection}.${entry.slug}`],
            fromJS(entry).set('isFetching', false),
          ),
        );
      });
    }

    case ENTRY_DELETE_SUCCESS: {
      const payload = action.payload as EntryDeletePayload;
      return state.withMutations(map => {
        map.deleteIn(['entities', `${payload.collectionName}.${payload.entrySlug}`]);
        map.updateIn(['pages', payload.collectionName, 'ids'], (ids: string[]) =>
          ids.filter(id => id !== payload.entrySlug),
        );
      });
    }

    default:
      return state;
  }
};

export const selectEntry = (state: Entries, collection: string, slug: string) =>
  state.getIn(['entities', `${collection}.${slug}`]);

export const selectPublishedSlugs = (state: Entries, collection: string) =>
  state.getIn(['pages', collection, 'ids'], List<string>());

export const selectEntries = (state: Entries, collection: string) => {
  const slugs = selectPublishedSlugs(state, collection);
  return slugs && slugs.map(slug => selectEntry(state, collection, slug as string));
};

const DRAFT_MEDIA_FILES = 'DRAFT_MEDIA_FILES';

export const selectMediaFolder = (
  config: Config,
  collection: Collection | null,
  entryMap: EntryMap | undefined,
) => {
  let mediaFolder = config.get('media_folder');

  if (collection && collection.has('media_folder')) {
    const entryPath = entryMap?.get('path');
    if (entryPath) {
      const entryDir = dirname(entryPath);
      const folder = folderFormatter(
        collection.get('media_folder') as string,
        entryMap as EntryMap,
        collection,
        mediaFolder,
        'media_folder',
        config.get('slug'),
      );
      // return absolute paths as is
      if (folder.startsWith('/')) {
        return folder;
      }
      mediaFolder = join(entryDir, folder as string);
    } else {
      mediaFolder = join(collection.get('folder') as string, DRAFT_MEDIA_FILES);
    }
  }

  return mediaFolder;
};

export const selectMediaFilePath = (
  config: Config,
  collection: Collection | null,
  entryMap: EntryMap | undefined,
  mediaPath: string,
) => {
  if (isAbsolutePath(mediaPath)) {
    return mediaPath;
  }

  const mediaFolder = selectMediaFolder(config, collection, entryMap);

  return join(mediaFolder, basename(mediaPath));
};

export const selectMediaFilePublicPath = (
  config: Config,
  collection: Collection | null,
  mediaPath: string,
  entryMap: EntryMap | undefined,
) => {
  if (isAbsolutePath(mediaPath)) {
    return mediaPath;
  }

  let publicFolder = config.get('public_folder');

  if (collection && collection.has('public_folder')) {
    publicFolder = folderFormatter(
      collection.get('public_folder') as string,
      entryMap,
      collection,
      publicFolder,
      'public_folder',
      config.get('slug'),
    );
  }

  return join(publicFolder, basename(mediaPath));
};

export const selectEditingDraft = (state: EntryDraft) => {
  const entry = state.get('entry');
  const workflowDraft = entry && !entry.isEmpty();
  return workflowDraft;
};

export default entries;
