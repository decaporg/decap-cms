import { Map, List, fromJS, OrderedMap, Set } from 'immutable';
import { dirname, join } from 'path';
import {
  ENTRY_REQUEST,
  ENTRY_SUCCESS,
  ENTRY_FAILURE,
  ENTRIES_REQUEST,
  ENTRIES_SUCCESS,
  ENTRIES_FAILURE,
  ENTRY_DELETE_SUCCESS,
  SORT_ENTRIES_REQUEST,
  SORT_ENTRIES_SUCCESS,
  SORT_ENTRIES_FAILURE,
  FILTER_ENTRIES_REQUEST,
  FILTER_ENTRIES_SUCCESS,
  FILTER_ENTRIES_FAILURE,
  GROUP_ENTRIES_REQUEST,
  GROUP_ENTRIES_SUCCESS,
  GROUP_ENTRIES_FAILURE,
  CHANGE_VIEW_STYLE,
} from '../actions/entries';
import { SEARCH_ENTRIES_SUCCESS } from '../actions/search';
import {
  EntriesAction,
  EntryRequestPayload,
  EntrySuccessPayload,
  EntriesSuccessPayload,
  EntryObject,
  Entries,
  CmsConfig,
  Collection,
  EntryFailurePayload,
  EntryDeletePayload,
  EntriesRequestPayload,
  EntryDraft,
  EntryMap,
  EntryField,
  CollectionFiles,
  EntriesSortRequestPayload,
  EntriesSortFailurePayload,
  SortMap,
  SortObject,
  Sort,
  SortDirection,
  Filter,
  Group,
  FilterMap,
  GroupMap,
  EntriesFilterRequestPayload,
  EntriesFilterFailurePayload,
  ChangeViewStylePayload,
  EntriesGroupRequestPayload,
  EntriesGroupFailurePayload,
  GroupOfEntries,
} from '../types/redux';
import { folderFormatter } from '../lib/formatters';
import { isAbsolutePath, basename } from 'netlify-cms-lib-util';
import { trim, once, sortBy, set, orderBy, groupBy } from 'lodash';
import { selectSortDataPath } from './collections';
import { stringTemplate } from 'netlify-cms-lib-widgets';
import { VIEW_STYLE_LIST } from '../constants/collectionViews';
import { joinUrlPath } from '../lib/urlHelper';

const { keyToPathArray } = stringTemplate;

let collection: string;
let loadedEntries: EntryObject[];
let append: boolean;
let page: number;
let slug: string;

const storageSortKey = 'netlify-cms.entries.sort';
const viewStyleKey = 'netlify-cms.entries.viewStyle';
type StorageSortObject = SortObject & { index: number };
type StorageSort = { [collection: string]: { [key: string]: StorageSortObject } };

const loadSort = once(() => {
  const sortString = localStorage.getItem(storageSortKey);
  if (sortString) {
    try {
      const sort: StorageSort = JSON.parse(sortString);
      let map = Map() as Sort;
      Object.entries(sort).forEach(([collection, sort]) => {
        let orderedMap = OrderedMap() as SortMap;
        sortBy(Object.values(sort), ['index']).forEach(value => {
          const { key, direction } = value;
          orderedMap = orderedMap.set(key, fromJS({ key, direction }));
        });
        map = map.set(collection, orderedMap);
      });
      return map;
    } catch (e) {
      return Map() as Sort;
    }
  }
  return Map() as Sort;
});

function clearSort() {
  localStorage.removeItem(storageSortKey);
}

function persistSort(sort: Sort | undefined) {
  if (sort) {
    const storageSort: StorageSort = {};
    sort.keySeq().forEach(key => {
      const collection = key as string;
      const sortObjects = (sort
        .get(collection)
        .valueSeq()
        .toJS() as SortObject[]).map((value, index) => ({ ...value, index }));

      sortObjects.forEach(value => {
        set(storageSort, [collection, value.key], value);
      });
    });
    localStorage.setItem(storageSortKey, JSON.stringify(storageSort));
  } else {
    clearSort();
  }
}

const loadViewStyle = once(() => {
  const viewStyle = localStorage.getItem(viewStyleKey);
  if (viewStyle) {
    return viewStyle;
  }

  localStorage.setItem(viewStyleKey, VIEW_STYLE_LIST);
  return VIEW_STYLE_LIST;
});

function clearViewStyle() {
  localStorage.removeItem(viewStyleKey);
}

function persistViewStyle(viewStyle: string | undefined) {
  if (viewStyle) {
    localStorage.setItem(viewStyleKey, viewStyle);
  } else {
    clearViewStyle();
  }
}

function entries(
  state = Map({ entities: Map(), pages: Map(), sort: loadSort(), viewStyle: loadViewStyle() }),
  action: EntriesAction,
) {
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
      const newState = state.withMutations(map => {
        map.setIn(['pages', payload.collection, 'isFetching'], true);
      });

      return newState;
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

    case SORT_ENTRIES_REQUEST: {
      const payload = action.payload as EntriesSortRequestPayload;
      const { collection, key, direction } = payload;
      const newState = state.withMutations(map => {
        const sort = OrderedMap({ [key]: Map({ key, direction }) });
        map.setIn(['sort', collection], sort);
        map.setIn(['pages', collection, 'isFetching'], true);
        map.deleteIn(['pages', collection, 'page']);
      });
      persistSort(newState.get('sort') as Sort);
      return newState;
    }

    case GROUP_ENTRIES_SUCCESS:
    case FILTER_ENTRIES_SUCCESS:
    case SORT_ENTRIES_SUCCESS: {
      const payload = action.payload as { collection: string; entries: EntryObject[] };
      const { collection, entries } = payload;
      loadedEntries = entries;
      const newState = state.withMutations(map => {
        loadedEntries.forEach(entry =>
          map.setIn(
            ['entities', `${entry.collection}.${entry.slug}`],
            fromJS(entry).set('isFetching', false),
          ),
        );
        map.setIn(['pages', collection, 'isFetching'], false);
        const ids = List(loadedEntries.map(entry => entry.slug));
        map.setIn(
          ['pages', collection],
          Map({
            page: 1,
            ids,
          }),
        );
      });
      return newState;
    }

    case SORT_ENTRIES_FAILURE: {
      const payload = action.payload as EntriesSortFailurePayload;
      const { collection, key } = payload;
      const newState = state.withMutations(map => {
        map.deleteIn(['sort', collection, key]);
        map.setIn(['pages', collection, 'isFetching'], false);
      });
      persistSort(newState.get('sort') as Sort);
      return newState;
    }

    case FILTER_ENTRIES_REQUEST: {
      const payload = action.payload as EntriesFilterRequestPayload;
      const { collection, filter } = payload;
      const newState = state.withMutations(map => {
        const current: FilterMap = map.getIn(['filter', collection, filter.id], fromJS(filter));
        map.setIn(
          ['filter', collection, current.get('id')],
          current.set('active', !current.get('active')),
        );
      });
      return newState;
    }

    case FILTER_ENTRIES_FAILURE: {
      const payload = action.payload as EntriesFilterFailurePayload;
      const { collection, filter } = payload;
      const newState = state.withMutations(map => {
        map.deleteIn(['filter', collection, filter.id]);
        map.setIn(['pages', collection, 'isFetching'], false);
      });
      return newState;
    }

    case GROUP_ENTRIES_REQUEST: {
      const payload = action.payload as EntriesGroupRequestPayload;
      const { collection, group } = payload;
      const newState = state.withMutations(map => {
        const current: GroupMap = map.getIn(['group', collection, group.id], fromJS(group));
        map.deleteIn(['group', collection]);
        map.setIn(
          ['group', collection, current.get('id')],
          current.set('active', !current.get('active')),
        );
      });
      return newState;
    }

    case GROUP_ENTRIES_FAILURE: {
      const payload = action.payload as EntriesGroupFailurePayload;
      const { collection, group } = payload;
      const newState = state.withMutations(map => {
        map.deleteIn(['group', collection, group.id]);
        map.setIn(['pages', collection, 'isFetching'], false);
      });
      return newState;
    }

    case CHANGE_VIEW_STYLE: {
      const payload = (action.payload as unknown) as ChangeViewStylePayload;
      const { style } = payload;
      const newState = state.withMutations(map => {
        map.setIn(['viewStyle'], style);
      });
      persistViewStyle(newState.get('viewStyle') as string);
      return newState;
    }

    default:
      return state;
  }
}

export function selectEntriesSort(entries: Entries, collection: string) {
  const sort = entries.get('sort') as Sort | undefined;
  return sort?.get(collection);
}

export function selectEntriesFilter(entries: Entries, collection: string) {
  const filter = entries.get('filter') as Filter | undefined;
  return filter?.get(collection) || Map();
}

export function selectEntriesGroup(entries: Entries, collection: string) {
  const group = entries.get('group') as Group | undefined;
  return group?.get(collection) || Map();
}

export function selectEntriesGroupField(entries: Entries, collection: string) {
  const groups = selectEntriesGroup(entries, collection);
  const value = groups?.valueSeq().find(v => v?.get('active') === true);
  return value;
}

export function selectEntriesSortFields(entries: Entries, collection: string) {
  const sort = selectEntriesSort(entries, collection);
  const values =
    sort
      ?.valueSeq()
      .filter(v => v?.get('direction') !== SortDirection.None)
      .toArray() || [];

  return values;
}

export function selectEntriesFilterFields(entries: Entries, collection: string) {
  const filter = selectEntriesFilter(entries, collection);
  const values =
    filter
      ?.valueSeq()
      .filter(v => v?.get('active') === true)
      .toArray() || [];
  return values;
}

export function selectViewStyle(entries: Entries) {
  return entries.get('viewStyle');
}

export function selectEntry(state: Entries, collection: string, slug: string) {
  return state.getIn(['entities', `${collection}.${slug}`]);
}

export function selectPublishedSlugs(state: Entries, collection: string) {
  return state.getIn(['pages', collection, 'ids'], List<string>());
}

function getPublishedEntries(state: Entries, collectionName: string) {
  const slugs = selectPublishedSlugs(state, collectionName);
  const entries =
    slugs &&
    (slugs.map(slug => selectEntry(state, collectionName, slug as string)) as List<EntryMap>);
  return entries;
}

export function selectEntries(state: Entries, collection: Collection) {
  const collectionName = collection.get('name');
  let entries = getPublishedEntries(state, collectionName);

  const sortFields = selectEntriesSortFields(state, collectionName);
  if (sortFields && sortFields.length > 0) {
    const keys = sortFields.map(v => selectSortDataPath(collection, v.get('key')));
    const orders = sortFields.map(v =>
      v.get('direction') === SortDirection.Ascending ? 'asc' : 'desc',
    );
    entries = fromJS(orderBy(entries.toJS(), keys, orders));
  }

  const filters = selectEntriesFilterFields(state, collectionName);
  if (filters && filters.length > 0) {
    entries = entries
      .filter(e => {
        const allMatched = filters.every(f => {
          const pattern = f.get('pattern');
          const field = f.get('field');
          const data = e!.get('data') || Map();
          const toMatch = data.getIn(keyToPathArray(field));
          const matched =
            toMatch !== undefined && new RegExp(String(pattern)).test(String(toMatch));
          return matched;
        });
        return allMatched;
      })
      .toList();
  }

  return entries;
}

function getGroup(entry: EntryMap, selectedGroup: GroupMap) {
  const label = selectedGroup.get('label');
  const field = selectedGroup.get('field');

  const fieldData = entry.getIn(['data', ...keyToPathArray(field)]);
  if (fieldData === undefined) {
    return {
      id: 'missing_value',
      label,
      value: fieldData,
    };
  }

  const dataAsString = String(fieldData);
  if (selectedGroup.has('pattern')) {
    const pattern = selectedGroup.get('pattern');
    let value = '';
    try {
      const regex = new RegExp(pattern);
      const matched = dataAsString.match(regex);
      if (matched) {
        value = matched[0];
      }
    } catch (e) {
      console.warn(`Invalid view group pattern '${pattern}' for field '${field}'`, e);
    }
    return {
      id: `${label}${value}`,
      label,
      value,
    };
  }

  return {
    id: `${label}${fieldData}`,
    label,
    value: typeof fieldData === 'boolean' ? fieldData : dataAsString,
  };
}

export function selectGroups(state: Entries, collection: Collection) {
  const collectionName = collection.get('name');
  const entries = getPublishedEntries(state, collectionName);

  const selectedGroup = selectEntriesGroupField(state, collectionName);
  if (selectedGroup === undefined) {
    return [];
  }

  let groups: Record<
    string,
    { id: string; label: string; value: string | boolean | undefined }
  > = {};
  const groupedEntries = groupBy(entries.toArray(), entry => {
    const group = getGroup(entry, selectedGroup);
    groups = { ...groups, [group.id]: group };
    return group.id;
  });

  const groupsArray: GroupOfEntries[] = Object.entries(groupedEntries).map(([id, entries]) => {
    return {
      ...groups[id],
      paths: Set(entries.map(entry => entry.get('path'))),
    };
  });

  return groupsArray;
}

export function selectEntryByPath(state: Entries, collection: string, path: string) {
  const slugs = selectPublishedSlugs(state, collection);
  const entries =
    slugs && (slugs.map(slug => selectEntry(state, collection, slug as string)) as List<EntryMap>);

  return entries && entries.find(e => e?.get('path') === path);
}

export function selectEntriesLoaded(state: Entries, collection: string) {
  return !!state.getIn(['pages', collection]);
}

export function selectIsFetching(state: Entries, collection: string) {
  return state.getIn(['pages', collection, 'isFetching'], false);
}

const DRAFT_MEDIA_FILES = 'DRAFT_MEDIA_FILES';

function getFileField(collectionFiles: CollectionFiles, slug: string | undefined) {
  const file = collectionFiles.find(f => f?.get('name') === slug);
  return file;
}

function hasCustomFolder(
  folderKey: 'media_folder' | 'public_folder',
  collection: Collection | null,
  slug: string | undefined,
  field: EntryField | undefined,
) {
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
}

function traverseFields(
  folderKey: 'media_folder' | 'public_folder',
  config: CmsConfig,
  collection: Collection,
  entryMap: EntryMap | undefined,
  field: EntryField,
  fields: EntryField[],
  currentFolder: string,
): string | null {
  const matchedField = fields.filter(f => f === field)[0];
  if (matchedField) {
    return folderFormatter(
      matchedField.has(folderKey) ? matchedField.get(folderKey)! : `{{${folderKey}}}`,
      entryMap,
      collection,
      currentFolder,
      folderKey,
      config.slug,
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
      config.slug,
    );
    let fieldFolder = null;
    if (f.has('fields')) {
      fieldFolder = traverseFields(
        folderKey,
        config,
        collection,
        entryMap,
        field,
        f.get('fields')!.toArray(),
        folder,
      );
    } else if (f.has('field')) {
      fieldFolder = traverseFields(
        folderKey,
        config,
        collection,
        entryMap,
        field,
        [f.get('field')!],
        folder,
      );
    } else if (f.has('types')) {
      fieldFolder = traverseFields(
        folderKey,
        config,
        collection,
        entryMap,
        field,
        f.get('types')!.toArray(),
        folder,
      );
    }
    if (fieldFolder != null) {
      return fieldFolder;
    }
  }

  return null;
}

function evaluateFolder(
  folderKey: 'media_folder' | 'public_folder',
  config: CmsConfig,
  collection: Collection,
  entryMap: EntryMap | undefined,
  field: EntryField | undefined,
) {
  let currentFolder = config[folderKey]!;

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
      config.slug,
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
        config.slug,
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
      config.slug,
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
}

export function selectMediaFolder(
  config: CmsConfig,
  collection: Collection | null,
  entryMap: EntryMap | undefined,
  field: EntryField | undefined,
) {
  const name = 'media_folder';
  let mediaFolder = config[name];

  const customFolder = hasCustomFolder(name, collection, entryMap?.get('slug'), field);

  if (customFolder) {
    const folder = evaluateFolder(name, config, collection!, entryMap, field);
    if (folder.startsWith('/')) {
      // return absolute paths as is
      mediaFolder = join(folder);
    } else {
      const entryPath = entryMap?.get('path');
      mediaFolder = entryPath
        ? join(dirname(entryPath), folder)
        : join(collection!.get('folder') as string, DRAFT_MEDIA_FILES);
    }
  }

  return trim(mediaFolder, '/');
}

export function selectMediaFilePath(
  config: CmsConfig,
  collection: Collection | null,
  entryMap: EntryMap | undefined,
  mediaPath: string,
  field: EntryField | undefined,
) {
  if (isAbsolutePath(mediaPath)) {
    return mediaPath;
  }

  const mediaFolder = selectMediaFolder(config, collection, entryMap, field);

  return join(mediaFolder, basename(mediaPath));
}

export function selectMediaFilePublicPath(
  config: CmsConfig,
  collection: Collection | null,
  mediaPath: string,
  entryMap: EntryMap | undefined,
  field: EntryField | undefined,
) {
  if (isAbsolutePath(mediaPath)) {
    return mediaPath;
  }

  const name = 'public_folder';
  let publicFolder = config[name]!;

  const customFolder = hasCustomFolder(name, collection, entryMap?.get('slug'), field);

  if (customFolder) {
    publicFolder = evaluateFolder(name, config, collection!, entryMap, field);
  }

  if (isAbsolutePath(publicFolder)) {
    return joinUrlPath(publicFolder, basename(mediaPath));
  }

  return join(publicFolder, basename(mediaPath));
}

export function selectEditingDraft(state: EntryDraft) {
  const entry = state.get('entry');
  const workflowDraft = entry && !entry.isEmpty();
  return workflowDraft;
}

export default entries;
