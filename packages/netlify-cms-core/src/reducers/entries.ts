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
  EntryField,
  CollectionFiles,
} from '../types/redux';
import { folderFormatter } from '../lib/formatters';
import { isAbsolutePath, basename } from 'netlify-cms-lib-util';
import { trim } from 'lodash';

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

const getFileField = (collectionFiles: CollectionFiles, slug: string | undefined) => {
  const file = collectionFiles.find(f => f?.get('name') === slug);
  return file;
};

const hasCustomFolder = (
  folderKey: 'media_folder' | 'public_folder',
  collection: Collection | null,
  slug: string | undefined,
  field: EntryField | undefined,
) => {
  if (!collection) {
    return false;
  }

  if (field && field.has(folderKey)) {
    return true;
  }

  if (collection.has('files')) {
    const file = getFileField(collection.get('files')!, slug);
    if (file && file.has(folderKey)) {
      return true;
    }
  }

  if (collection.has(folderKey)) {
    return true;
  }

  return false;
};

const traverseFields = (
  folderKey: 'media_folder' | 'public_folder',
  config: Config,
  collection: Collection,
  entryMap: EntryMap | undefined,
  field: EntryField,
  fields: EntryField[],
  currentFolder: string,
): string | null => {
  const matchedField = fields.filter(f => f === field)[0];
  if (matchedField) {
    return folderFormatter(
      matchedField.has(folderKey) ? matchedField.get(folderKey)! : `{{${folderKey}}}`,
      entryMap,
      collection,
      currentFolder,
      folderKey,
      config.get('slug'),
    );
  }

  for (let f of fields) {
    if (!f.has(folderKey)) {
      // add identity template if doesn't exist
      f = f.set(folderKey, `{{${folderKey}}}`);
    }
    const folder = folderFormatter(
      f.get(folderKey)!,
      entryMap,
      collection,
      currentFolder,
      folderKey,
      config.get('slug'),
    );
    if (f.has('fields')) {
      return traverseFields(
        folderKey,
        config,
        collection,
        entryMap,
        field,
        f.get('fields')!.toArray(),
        folder,
      );
    } else if (f.has('field')) {
      return traverseFields(
        folderKey,
        config,
        collection,
        entryMap,
        field,
        [f.get('field')!],
        folder,
      );
    }
  }

  return null;
};

const evaluateFolder = (
  folderKey: 'media_folder' | 'public_folder',
  config: Config,
  collection: Collection,
  entryMap: EntryMap | undefined,
  field: EntryField | undefined,
) => {
  let currentFolder = config.get(folderKey);

  // add identity template if doesn't exist
  if (!collection.has(folderKey)) {
    collection = collection.set(folderKey, `{{${folderKey}}}`);
  }

  if (collection.has('files')) {
    // files collection evaluate the collection template
    // then move on to the specific file configuration denoted by the slug
    currentFolder = folderFormatter(
      collection.get(folderKey)!,
      entryMap,
      collection,
      currentFolder,
      folderKey,
      config.get('slug'),
    );

    let file = getFileField(collection.get('files')!, entryMap?.get('slug'));
    if (file) {
      if (!file.has(folderKey)) {
        // add identity template if doesn't exist
        file = file.set(folderKey, `{{${folderKey}}}`);
      }

      // evaluate the file template and keep evaluating until we match our field
      currentFolder = folderFormatter(
        file.get(folderKey)!,
        entryMap,
        collection,
        currentFolder,
        folderKey,
        config.get('slug'),
      );

      if (field) {
        const fieldFolder = traverseFields(
          folderKey,
          config,
          collection,
          entryMap,
          field,
          file.get('fields')!.toArray(),
          currentFolder,
        );

        if (fieldFolder !== null) {
          currentFolder = fieldFolder;
        }
      }
    }
  } else {
    // folder collection, evaluate the collection template
    // and keep evaluating until we match our field
    currentFolder = folderFormatter(
      collection.get(folderKey)!,
      entryMap,
      collection,
      currentFolder,
      folderKey,
      config.get('slug'),
    );

    if (field) {
      const fieldFolder = traverseFields(
        folderKey,
        config,
        collection,
        entryMap,
        field,
        collection.get('fields')!.toArray(),
        currentFolder,
      );

      if (fieldFolder !== null) {
        currentFolder = fieldFolder;
      }
    }
  }

  return currentFolder;
};

export const selectMediaFolder = (
  config: Config,
  collection: Collection | null,
  entryMap: EntryMap | undefined,
  field: EntryField | undefined,
) => {
  const name = 'media_folder';
  let mediaFolder = config.get(name);

  const customFolder = hasCustomFolder(name, collection, entryMap?.get('slug'), field);

  if (customFolder) {
    const entryPath = entryMap?.get('path');
    if (entryPath) {
      const entryDir = dirname(entryPath);
      const folder = evaluateFolder(name, config, collection!, entryMap, field);
      // return absolute paths as is
      if (folder.startsWith('/')) {
        mediaFolder = join(folder);
      } else {
        mediaFolder = join(entryDir, folder as string);
      }
    } else {
      mediaFolder = join(collection!.get('folder') as string, DRAFT_MEDIA_FILES);
    }
  }

  return trim(mediaFolder, '/');
};

export const selectMediaFilePath = (
  config: Config,
  collection: Collection | null,
  entryMap: EntryMap | undefined,
  mediaPath: string,
  field: EntryField | undefined,
) => {
  if (isAbsolutePath(mediaPath)) {
    return mediaPath;
  }

  const mediaFolder = selectMediaFolder(config, collection, entryMap, field);

  return join(mediaFolder, basename(mediaPath));
};

export const selectMediaFilePublicPath = (
  config: Config,
  collection: Collection | null,
  mediaPath: string,
  entryMap: EntryMap | undefined,
  field: EntryField | undefined,
) => {
  if (isAbsolutePath(mediaPath)) {
    return mediaPath;
  }

  const name = 'public_folder';
  let publicFolder = config.get(name);

  const customFolder = hasCustomFolder(name, collection, entryMap?.get('slug'), field);

  if (customFolder) {
    publicFolder = evaluateFolder(name, config, collection!, entryMap, field);
  }

  return join(publicFolder, basename(mediaPath));
};

export const selectEditingDraft = (state: EntryDraft) => {
  const entry = state.get('entry');
  const workflowDraft = entry && !entry.isEmpty();
  return workflowDraft;
};

export default entries;
