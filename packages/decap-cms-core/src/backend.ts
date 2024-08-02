import { attempt, flatten, isError, uniq, trim, sortBy, get, set } from 'lodash';
import { List, fromJS, Set } from 'immutable';
import * as fuzzy from 'fuzzy';
import {
  localForage,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  getPathDepth,
  blobToFileObj,
  asyncLock,
  EDITORIAL_WORKFLOW_ERROR,
} from 'decap-cms-lib-util';
import { basename, join, extname, dirname } from 'path';
import { stringTemplate } from 'decap-cms-lib-widgets';

import { resolveFormat } from './formats/formats';
import { selectUseWorkflow } from './reducers/config';
import { selectMediaFilePath, selectEntry } from './reducers/entries';
import { selectIntegration } from './reducers/integrations';
import {
  selectEntrySlug,
  selectEntryPath,
  selectFileEntryLabel,
  selectAllowNewEntries,
  selectAllowDeletion,
  selectFolderEntryExtension,
  selectInferredField,
  selectMediaFolders,
  selectFieldsComments,
  selectHasMetaPath,
} from './reducers/collections';
import { createEntry } from './valueObjects/Entry';
import { sanitizeChar } from './lib/urlHelper';
import { getBackend, invokeEvent } from './lib/registry';
import { commitMessageFormatter, slugFormatter, previewUrlFormatter } from './lib/formatters';
import { status } from './constants/publishModes';
import { FOLDER, FILES } from './constants/collectionTypes';
import { selectCustomPath } from './reducers/entryDraft';
import {
  getI18nFilesDepth,
  getI18nFiles,
  hasI18n,
  getFilePaths,
  getI18nEntry,
  groupEntries,
  getI18nDataFiles,
  getI18nBackup,
  formatI18nBackup,
  getI18nInfo,
  I18N_STRUCTURE,
} from './lib/i18n';

import type { I18nInfo } from './lib/i18n';
import type AssetProxy from './valueObjects/AssetProxy';
import type {
  CmsConfig,
  EntryMap,
  FilterRule,
  EntryDraft,
  Collection,
  Collections,
  CollectionFile,
  State,
  EntryField,
} from './types/redux';
import type { EntryValue } from './valueObjects/Entry';
import type {
  Implementation as BackendImplementation,
  DisplayURL,
  ImplementationEntry,
  Credentials,
  User,
  AsyncLock,
  UnpublishedEntry,
  DataFile,
  UnpublishedEntryDiff,
} from 'decap-cms-lib-util';
import type { Map } from 'immutable';

const { extractTemplateVars, dateParsers, expandPath } = stringTemplate;

function updateAssetProxies(
  assetProxies: AssetProxy[],
  config: CmsConfig,
  collection: Collection,
  entryDraft: EntryDraft,
  path: string,
) {
  assetProxies.map(asset => {
    // update media files path based on entry path
    const oldPath = asset.path;
    const newPath = selectMediaFilePath(
      config,
      collection,
      entryDraft.get('entry').set('path', path),
      oldPath,
      asset.field,
    );
    asset.path = newPath;
  });
}

export class LocalStorageAuthStore {
  storageKey = 'decap-cms-user';

  retrieve() {
    const data = window.localStorage.getItem(this.storageKey);
    return data && JSON.parse(data);
  }

  store(userData: unknown) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(userData));
  }

  logout() {
    window.localStorage.removeItem(this.storageKey);
  }
}

function getEntryBackupKey(collectionName?: string, slug?: string) {
  const baseKey = 'backup';
  if (!collectionName) {
    return baseKey;
  }
  const suffix = slug ? `.${slug}` : '';
  return `${baseKey}.${collectionName}${suffix}`;
}

function getEntryField(field: string, entry: EntryValue) {
  const value = get(entry.data, field);
  if (value) {
    return String(value);
  } else {
    const firstFieldPart = field.split('.')[0];
    if (entry[firstFieldPart as keyof EntryValue]) {
      // allows searching using entry.slug/entry.path etc.
      return entry[firstFieldPart as keyof EntryValue];
    } else {
      return '';
    }
  }
}

export function extractSearchFields(searchFields: string[]) {
  return (entry: EntryValue) =>
    searchFields.reduce((acc, field) => {
      const value = getEntryField(field, entry);
      if (value) {
        return `${acc} ${value}`;
      } else {
        return acc;
      }
    }, '');
}

export function expandSearchEntries(entries: EntryValue[], searchFields: string[]) {
  // expand the entries for the purpose of the search
  const expandedEntries = entries.reduce((acc, e) => {
    const expandedFields = searchFields.reduce((acc, f) => {
      const fields = expandPath({ data: e.data, path: f });
      acc.push(...fields);
      return acc;
    }, [] as string[]);

    for (let i = 0; i < expandedFields.length; i++) {
      acc.push({ ...e, field: expandedFields[i] });
    }

    return acc;
  }, [] as (EntryValue & { field: string })[]);

  return expandedEntries;
}

export function mergeExpandedEntries(entries: (EntryValue & { field: string })[]) {
  // merge the search results by slug and only keep data that matched the search
  const fields = entries.map(f => f.field);
  const arrayPaths: Record<string, Set<string>> = {};

  const merged = entries.reduce((acc, e) => {
    if (!acc[e.slug]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { field, ...rest } = e;
      acc[e.slug] = rest;
      arrayPaths[e.slug] = Set();
    }

    const nestedFields = e.field.split('.');
    let value = acc[e.slug].data;
    for (let i = 0; i < nestedFields.length; i++) {
      value = value[nestedFields[i]];
      if (Array.isArray(value)) {
        const path = nestedFields.slice(0, i + 1).join('.');
        arrayPaths[e.slug] = arrayPaths[e.slug].add(path);
      }
    }

    return acc;
  }, {} as Record<string, EntryValue>);

  // this keeps the search score sorting order designated by the order in entries
  // and filters non matching items
  Object.keys(merged).forEach(slug => {
    const data = merged[slug].data;
    for (const path of arrayPaths[slug].toArray()) {
      const array = get(data, path) as unknown[];
      const filtered = array.filter((_, index) => {
        return fields.some(f => `${f}.`.startsWith(`${path}.${index}.`));
      });
      filtered.sort((a, b) => {
        const indexOfA = array.indexOf(a);
        const indexOfB = array.indexOf(b);
        const pathOfA = `${path}.${indexOfA}.`;
        const pathOfB = `${path}.${indexOfB}.`;

        const matchingFieldIndexA = fields.findIndex(f => `${f}.`.startsWith(pathOfA));
        const matchingFieldIndexB = fields.findIndex(f => `${f}.`.startsWith(pathOfB));

        return matchingFieldIndexA - matchingFieldIndexB;
      });

      set(data, path, filtered);
    }
  });

  return Object.values(merged);
}

function sortByScore(a: fuzzy.FilterResult<EntryValue>, b: fuzzy.FilterResult<EntryValue>) {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
}

export function slugFromCustomPath(collection: Collection, customPath: string) {
  const folderPath = collection.get('folder', '') as string;
  const entryPath = customPath.toLowerCase().replace(folderPath.toLowerCase(), '');
  const slug = join(dirname(trim(entryPath, '/')), basename(entryPath, extname(customPath)));
  return slug;
}

interface AuthStore {
  retrieve: () => User;
  store: (user: User) => void;
  logout: () => void;
}

interface BackendOptions {
  backendName: string;
  config: CmsConfig;
  authStore?: AuthStore;
}

export interface MediaFile {
  name: string;
  id: string;
  size?: number;
  displayURL?: DisplayURL;
  path: string;
  draft?: boolean;
  url?: string;
  file?: File;
  field?: EntryField;
}

interface BackupEntry {
  raw: string;
  path: string;
  mediaFiles: MediaFile[];
  i18n?: Record<string, { raw: string }>;
}

interface PersistArgs {
  config: CmsConfig;
  collection: Collection;
  entryDraft: EntryDraft;
  assetProxies: AssetProxy[];
  usedSlugs: List<string>;
  unpublished?: boolean;
  status?: string;
}

interface ImplementationInitOptions {
  useWorkflow: boolean;
  updateUserCredentials: (credentials: Credentials) => void;
  initialWorkflowStatus: string;
}

type Implementation = BackendImplementation & {
  init: (config: CmsConfig, options: ImplementationInitOptions) => Implementation;
};

function prepareMetaPath(path: string, collection: Collection) {
  if (!selectHasMetaPath(collection)) {
    return path;
  }
  const dir = dirname(path);
  return dir.slice(collection.get('folder')!.length + 1) || '/';
}

function collectionDepth(collection: Collection) {
  let depth;
  depth =
    collection.get('nested')?.get('depth') || getPathDepth(collection.get('path', '') as string);

  if (hasI18n(collection)) {
    depth = getI18nFilesDepth(collection, depth);
  }

  return depth;
}

function i18nRulestring(ruleString: string, { defaultLocale, structure }: I18nInfo): string {
  if (structure === I18N_STRUCTURE.MULTIPLE_FOLDERS) {
    return `${defaultLocale}\\/${ruleString}`;
  }

  if (structure === I18N_STRUCTURE.MULTIPLE_FILES) {
    return `${ruleString}\\.${defaultLocale}\\..*`;
  }

  return ruleString;
}

function collectionRegex(collection: Collection): RegExp | undefined {
  let ruleString = '';

  if (collection.get('path')) {
    ruleString = `${collection.get('folder')}/${collection.get('path')}`.replace(
      /{{.*}}/gm,
      '(.*)',
    );
  }

  if (hasI18n(collection)) {
    ruleString = i18nRulestring(ruleString, getI18nInfo(collection) as I18nInfo);
  }

  return ruleString ? new RegExp(ruleString) : undefined;
}

export class Backend {
  implementation: Implementation;
  backendName: string;
  config: CmsConfig;
  authStore?: AuthStore;
  user?: User | null;
  backupSync: AsyncLock;

  constructor(implementation: Implementation, { backendName, authStore, config }: BackendOptions) {
    // We can't reliably run this on exit, so we do cleanup on load.
    this.deleteAnonymousBackup();
    this.config = config;
    this.implementation = implementation.init(this.config, {
      useWorkflow: selectUseWorkflow(this.config),
      updateUserCredentials: this.updateUserCredentials,
      initialWorkflowStatus: status.first(),
    });
    this.backendName = backendName;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error('Cannot instantiate a Backend with no implementation');
    }
    this.backupSync = asyncLock();
  }

  async status() {
    const attempts = 3;
    let status: {
      auth: { status: boolean };
      api: { status: boolean; statusPage: string };
    } = {
      auth: { status: true },
      api: { status: true, statusPage: '' },
    };
    for (let i = 1; i <= attempts; i++) {
      status = await this.implementation.status();
      // return on first success
      if (Object.values(status).every(s => s.status === true)) {
        return status;
      } else {
        await new Promise(resolve => setTimeout(resolve, i * 1000));
      }
    }
    return status;
  }

  currentUser() {
    if (this.user) {
      return this.user;
    }
    const stored = this.authStore!.retrieve();
    if (stored && stored.backendName === this.backendName) {
      return Promise.resolve(this.implementation.restoreUser(stored)).then(user => {
        this.user = { ...user, backendName: this.backendName };
        // return confirmed/rehydrated user object instead of stored
        this.authStore!.store(this.user as User);
        return this.user;
      });
    }
    return Promise.resolve(null);
  }

  isGitBackend() {
    return this.implementation.isGitBackend?.() || false;
  }

  updateUserCredentials = (updatedCredentials: Credentials) => {
    const storedUser = this.authStore!.retrieve();
    if (storedUser && storedUser.backendName === this.backendName) {
      this.user = { ...storedUser, ...updatedCredentials };
      this.authStore!.store(this.user as User);
      return this.user;
    }
  };

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials: Credentials) {
    return this.implementation.authenticate(credentials).then(user => {
      this.user = { ...user, backendName: this.backendName };
      if (this.authStore) {
        this.authStore.store(this.user as User);
      }
      return this.user;
    });
  }

  async logout() {
    try {
      await this.implementation.logout();
    } catch (e) {
      console.warn('Error during logout', e.message);
    } finally {
      this.user = null;
      if (this.authStore) {
        this.authStore.logout();
      }
    }
  }

  getToken = () => this.implementation.getToken();

  async entryExist(collection: Collection, path: string, slug: string, useWorkflow: boolean) {
    const unpublishedEntry =
      useWorkflow &&
      (await this.implementation
        .unpublishedEntry({ collection: collection.get('name'), slug })
        .catch(error => {
          if (error.name === EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
            return Promise.resolve(false);
          }
          return Promise.reject(error);
        }));

    if (unpublishedEntry) return unpublishedEntry;

    const publishedEntry = await this.implementation
      .getEntry(path)
      .then(({ data }) => data)
      .catch(() => {
        return Promise.resolve(false);
      });

    return publishedEntry;
  }

  async generateUniqueSlug(
    collection: Collection,
    entryData: Map<string, unknown>,
    config: CmsConfig,
    usedSlugs: List<string>,
    customPath: string | undefined,
  ) {
    const slugConfig = config.slug;
    let slug: string;
    if (customPath) {
      slug = slugFromCustomPath(collection, customPath);
    } else {
      slug = slugFormatter(collection, entryData, slugConfig);
    }
    let i = 1;
    let uniqueSlug = slug;

    // Check for duplicate slug in loaded entities store first before repo
    while (
      usedSlugs.includes(uniqueSlug) ||
      (await this.entryExist(
        collection,
        selectEntryPath(collection, uniqueSlug) as string,
        uniqueSlug,
        selectUseWorkflow(config),
      ))
    ) {
      uniqueSlug = `${slug}${sanitizeChar(' ', slugConfig)}${i++}`;
    }
    return uniqueSlug;
  }

  processEntries(loadedEntries: ImplementationEntry[], collection: Collection) {
    const entries = loadedEntries.map(loadedEntry =>
      createEntry(
        collection.get('name'),
        selectEntrySlug(collection, loadedEntry.file.path),
        loadedEntry.file.path,
        {
          raw: loadedEntry.data || '',
          label: loadedEntry.file.label,
          author: loadedEntry.file.author,
          updatedOn: loadedEntry.file.updatedOn,
          meta: { path: prepareMetaPath(loadedEntry.file.path, collection) },
        },
      ),
    );
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const collectionFilter = collection.get('filter');
    const filteredEntries = collectionFilter
      ? this.filterEntries({ entries: formattedEntries }, collectionFilter)
      : formattedEntries;

    if (hasI18n(collection)) {
      const extension = selectFolderEntryExtension(collection);
      const groupedEntries = groupEntries(collection, extension, filteredEntries);
      return groupedEntries;
    }

    return filteredEntries;
  }

  async listEntries(collection: Collection) {
    const extension = selectFolderEntryExtension(collection);
    let listMethod: () => Promise<ImplementationEntry[]>;
    const collectionType = collection.get('type');
    if (collectionType === FOLDER) {
      listMethod = () => {
        const depth = collectionDepth(collection);
        return this.implementation.entriesByFolder(
          collection.get('folder') as string,
          extension,
          depth,
        );
      };
    } else if (collectionType === FILES) {
      const files = collection
        .get('files')!
        .map(collectionFile => ({
          path: collectionFile!.get('file'),
          label: collectionFile!.get('label'),
        }))
        .toArray();
      listMethod = () => this.implementation.entriesByFiles(files);
    } else {
      throw new Error(`Unknown collection type: ${collectionType}`);
    }
    const loadedEntries = await listMethod();
    /*
          Wrap cursors so we can tell which collection the cursor is
          from. This is done to prevent traverseCursor from requiring a
          `collection` argument.
        */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const cursor = Cursor.create(loadedEntries[CURSOR_COMPATIBILITY_SYMBOL]).wrapData({
      cursorType: 'collectionEntries',
      collection,
    });
    return {
      entries: this.processEntries(loadedEntries, collection),
      pagination: cursor.meta?.get('page'),
      cursor,
    };
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection: Collection) {
    if (collection.get('folder') && this.implementation.allEntriesByFolder) {
      const depth = collectionDepth(collection);
      const extension = selectFolderEntryExtension(collection);
      return this.implementation
        .allEntriesByFolder(
          collection.get('folder') as string,
          extension,
          depth,
          collectionRegex(collection),
        )
        .then(entries => this.processEntries(entries, collection));
    }

    const response = await this.listEntries(collection);
    const { entries } = response;
    let { cursor } = response;
    while (cursor && cursor.actions!.includes('next')) {
      const { entries: newEntries, cursor: newCursor } = await this.traverseCursor(cursor, 'next');
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries;
  }

  async search(collections: Collection[], searchTerm: string) {
    // Perform a local search by requesting all entries. For each
    // collection, load it, search, and call onCollectionResults with
    // its results.
    const errors: Error[] = [];
    const collectionEntriesRequests = collections
      .map(async collection => {
        const summary = collection.get('summary', '') as string;
        const summaryFields = extractTemplateVars(summary);

        // TODO: pass search fields in as an argument
        let searchFields: (string | null | undefined)[] = [];

        if (collection.get('type') === FILES) {
          collection.get('files')?.forEach(f => {
            const topLevelFields = f!
              .get('fields')
              .map(f => f!.get('name'))
              .toArray();
            searchFields = [...searchFields, ...topLevelFields];
          });
        } else {
          searchFields = [
            selectInferredField(collection, 'title'),
            selectInferredField(collection, 'shortTitle'),
            selectInferredField(collection, 'author'),
            ...summaryFields.map(elem => {
              if (dateParsers[elem]) {
                return selectInferredField(collection, 'date');
              }
              return elem;
            }),
          ];
        }
        const filteredSearchFields = searchFields.filter(Boolean) as string[];
        const collectionEntries = await this.listAllEntries(collection);
        return fuzzy.filter(searchTerm, collectionEntries, {
          extract: extractSearchFields(uniq(filteredSearchFields)),
        });
      })
      .map(p =>
        p.catch(err => {
          errors.push(err);
          return [] as fuzzy.FilterResult<EntryValue>[];
        }),
      );

    const entries = await Promise.all(collectionEntriesRequests).then(arrays => flatten(arrays));

    if (errors.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new Error({ message: 'Errors occurred while searching entries locally!', errors });
    }

    const hits = entries
      .filter(({ score }: fuzzy.FilterResult<EntryValue>) => score > 5)
      .sort(sortByScore)
      .map((f: fuzzy.FilterResult<EntryValue>) => f.original);
    return { entries: hits };
  }

  async query(
    collection: Collection,
    searchFields: string[],
    searchTerm: string,
    file?: string,
    limit?: number,
  ) {
    let entries = await this.listAllEntries(collection);
    if (file) {
      entries = entries.filter(e => e.slug === file);
    }

    const expandedEntries = expandSearchEntries(entries, searchFields);

    let hits = fuzzy
      .filter(searchTerm, expandedEntries, {
        extract: entry => {
          return getEntryField(entry.field, entry);
        },
      })
      .sort(sortByScore)
      .map(f => f.original);

    if (limit !== undefined && limit > 0) {
      hits = hits.slice(0, limit);
    }

    const merged = mergeExpandedEntries(hits);
    return { query: searchTerm, hits: merged };
  }

  traverseCursor(cursor: Cursor, action: string) {
    const [data, unwrappedCursor] = cursor.unwrapData();
    // TODO: stop assuming all cursors are for collections
    const collection = data.get('collection') as Collection;
    return this.implementation!.traverseCursor!(unwrappedCursor, action).then(
      async ({ entries, cursor: newCursor }) => ({
        entries: this.processEntries(entries, collection),
        cursor: Cursor.create(newCursor).wrapData({
          cursorType: 'collectionEntries',
          collection,
        }),
      }),
    );
  }

  async getLocalDraftBackup(collection: Collection, slug: string) {
    const key = getEntryBackupKey(collection.get('name'), slug);
    const backup = await localForage.getItem<BackupEntry>(key);
    if (!backup || !backup.raw.trim()) {
      return {};
    }
    const { raw, path } = backup;
    let { mediaFiles = [] } = backup;

    mediaFiles = mediaFiles.map(file => {
      // de-serialize the file object
      if (file.file) {
        return { ...file, url: URL.createObjectURL(file.file) };
      }
      return file;
    });

    const label = selectFileEntryLabel(collection, slug);

    const formatRawData = (raw: string) => {
      return this.entryWithFormat(collection)(
        createEntry(collection.get('name'), slug, path, {
          raw,
          label,
          mediaFiles,
          meta: { path: prepareMetaPath(path, collection) },
        }),
      );
    };

    const entry: EntryValue = formatRawData(raw);
    if (hasI18n(collection) && backup.i18n) {
      const i18n = formatI18nBackup(backup.i18n, formatRawData);
      entry.i18n = i18n;
    }

    return { entry };
  }

  async persistLocalDraftBackup(entry: EntryMap, collection: Collection) {
    try {
      await this.backupSync.acquire();
      const key = getEntryBackupKey(collection.get('name'), entry.get('slug'));
      const raw = this.entryToRaw(collection, entry);

      if (!raw.trim()) {
        return;
      }

      const mediaFiles = await Promise.all<MediaFile>(
        entry
          .get('mediaFiles')
          .toJS()
          .map(async (file: MediaFile) => {
            // make sure to serialize the file
            if (file.url?.startsWith('blob:')) {
              const blob = await fetch(file.url as string).then(res => res.blob());
              return { ...file, file: blobToFileObj(file.name, blob) };
            }
            return file;
          }),
      );

      let i18n;
      if (hasI18n(collection)) {
        i18n = getI18nBackup(collection, entry, entry => this.entryToRaw(collection, entry));
      }

      await localForage.setItem<BackupEntry>(key, {
        raw,
        path: entry.get('path'),
        mediaFiles,
        ...(i18n && { i18n }),
      });
      const result = await localForage.setItem(getEntryBackupKey(), raw);
      return result;
    } catch (e) {
      console.warn('persistLocalDraftBackup', e);
    } finally {
      this.backupSync.release();
    }
  }

  async deleteLocalDraftBackup(collection: Collection, slug: string) {
    try {
      await this.backupSync.acquire();
      await localForage.removeItem(getEntryBackupKey(collection.get('name'), slug));
      // delete new entry backup if not deleted
      slug && (await localForage.removeItem(getEntryBackupKey(collection.get('name'))));
      const result = await this.deleteAnonymousBackup();
      return result;
    } catch (e) {
      console.warn('deleteLocalDraftBackup', e);
    } finally {
      this.backupSync.release();
    }
  }

  // Unnamed backup for use in the global error boundary, should always be
  // deleted on cms load.
  deleteAnonymousBackup() {
    return localForage.removeItem(getEntryBackupKey());
  }

  async getEntry(state: State, collection: Collection, slug: string) {
    const path = selectEntryPath(collection, slug) as string;
    const label = selectFileEntryLabel(collection, slug);
    const extension = selectFolderEntryExtension(collection);

    const getEntryValue = async (path: string) => {
      const loadedEntry = await this.implementation.getEntry(path);
      let entry = createEntry(collection.get('name'), slug, loadedEntry.file.path, {
        raw: loadedEntry.data,
        label,
        mediaFiles: [],
        meta: { path: prepareMetaPath(loadedEntry.file.path, collection) },
      });

      entry = this.entryWithFormat(collection)(entry);
      entry = await this.processEntry(state, collection, entry);

      return entry;
    };

    let entryValue: EntryValue;
    if (hasI18n(collection)) {
      entryValue = await getI18nEntry(collection, extension, path, slug, getEntryValue);
    } else {
      entryValue = await getEntryValue(path);
    }

    return entryValue;
  }

  getMedia() {
    return this.implementation.getMedia();
  }

  getMediaFile(path: string) {
    return this.implementation.getMediaFile(path);
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    if (this.implementation.getMediaDisplayURL) {
      return this.implementation.getMediaDisplayURL(displayURL);
    }
    const err = new Error(
      'getMediaDisplayURL is not implemented by the current backend, but the backend returned a displayURL which was not a string!',
    ) as Error & { displayURL: DisplayURL };
    err.displayURL = displayURL;
    return Promise.reject(err);
  }

  entryWithFormat(collection: Collection) {
    return (entry: EntryValue): EntryValue => {
      const format = resolveFormat(collection, entry);
      if (entry && entry.raw !== undefined) {
        const data = (format && attempt(format.fromFile.bind(format, entry.raw))) || {};
        if (isError(data)) console.error(data);
        return Object.assign(entry, { data: isError(data) ? {} : data });
      }
      return format.fromFile(entry);
    };
  }

  async processUnpublishedEntry(
    collection: Collection,
    entryData: UnpublishedEntry,
    withMediaFiles: boolean,
  ) {
    const { slug } = entryData;
    let extension: string;
    if (collection.get('type') === FILES) {
      const file = collection.get('files')!.find(f => f?.get('name') === slug);
      extension = extname(file.get('file'));
    } else {
      extension = selectFolderEntryExtension(collection);
    }

    const mediaFiles: MediaFile[] = [];
    if (withMediaFiles) {
      const nonDataFiles = entryData.diffs.filter(d => !d.path.endsWith(extension));
      const files = await Promise.all(
        nonDataFiles.map(f =>
          this.implementation!.unpublishedEntryMediaFile(
            collection.get('name'),
            slug,
            f.path,
            f.id,
          ),
        ),
      );
      mediaFiles.push(...files.map(f => ({ ...f, draft: true })));
    }

    const dataFiles = sortBy(
      entryData.diffs.filter(d => d.path.endsWith(extension)),
      f => f.path.length,
    );

    const formatData = (data: string, path: string, newFile: boolean) => {
      const entry = createEntry(collection.get('name'), slug, path, {
        raw: data,
        isModification: !newFile,
        label: collection && selectFileEntryLabel(collection, slug),
        mediaFiles,
        updatedOn: entryData.updatedAt,
        author: entryData.pullRequestAuthor,
        status: entryData.status,
        meta: { path: prepareMetaPath(path, collection) },
      });

      const entryWithFormat = this.entryWithFormat(collection)(entry);
      return entryWithFormat;
    };

    const readAndFormatDataFile = async (dataFile: UnpublishedEntryDiff) => {
      const data = await this.implementation.unpublishedEntryDataFile(
        collection.get('name'),
        entryData.slug,
        dataFile.path,
        dataFile.id,
      );
      const entryWithFormat = formatData(data, dataFile.path, dataFile.newFile);
      return entryWithFormat;
    };

    // if the unpublished entry has no diffs, return the original
    if (dataFiles.length <= 0) {
      const loadedEntry = await this.implementation.getEntry(
        selectEntryPath(collection, slug) as string,
      );
      return formatData(loadedEntry.data, loadedEntry.file.path, false);
    } else if (hasI18n(collection)) {
      // we need to read all locales files and not just the changes
      const path = selectEntryPath(collection, slug) as string;
      const i18nFiles = getI18nDataFiles(collection, extension, path, slug, dataFiles);
      let entries = await Promise.all(
        i18nFiles.map(dataFile => readAndFormatDataFile(dataFile).catch(() => null)),
      );
      entries = entries.filter(Boolean);
      const grouped = await groupEntries(collection, extension, entries as EntryValue[]);
      return grouped[0];
    } else {
      const entryWithFormat = await readAndFormatDataFile(dataFiles[0]);
      return entryWithFormat;
    }
  }

  async unpublishedEntries(collections: Collections) {
    const ids = await this.implementation.unpublishedEntries!();
    const entries = (
      await Promise.all(
        ids.map(async id => {
          const entryData = await this.implementation.unpublishedEntry({ id });
          const collectionName = entryData.collection;
          const collection = collections.find(c => c.get('name') === collectionName);
          if (!collection) {
            console.warn(`Missing collection '${collectionName}' for unpublished entry '${id}'`);
            return null;
          }
          const entry = await this.processUnpublishedEntry(collection, entryData, false);
          return entry;
        }),
      )
    ).filter(Boolean) as EntryValue[];

    return { pagination: 0, entries };
  }

  async processEntry(state: State, collection: Collection, entry: EntryValue) {
    const integration = selectIntegration(state.integrations, null, 'assetStore');
    const mediaFolders = selectMediaFolders(state.config, collection, fromJS(entry));
    if (mediaFolders.length > 0 && !integration) {
      const files = await Promise.all(
        mediaFolders.map(folder => this.implementation.getMedia(folder)),
      );
      entry.mediaFiles = entry.mediaFiles.concat(...files);
    } else {
      entry.mediaFiles = entry.mediaFiles.concat(state.mediaLibrary.get('files') || []);
    }

    return entry;
  }

  async unpublishedEntry(state: State, collection: Collection, slug: string) {
    const entryData = await this.implementation!.unpublishedEntry!({
      collection: collection.get('name') as string,
      slug,
    });

    let entry = await this.processUnpublishedEntry(collection, entryData, true);
    entry = await this.processEntry(state, collection, entry);
    return entry;
  }

  /**
   * Creates a URL using `site_url` from the config and `preview_path` from the
   * entry's collection. Does not currently make a request through the backend,
   * but likely will in the future.
   */
  getDeploy(collection: Collection, slug: string, entry: EntryMap) {
    /**
     * If `site_url` is undefined or `show_preview_links` in the config is set to false, do nothing.
     */

    const baseUrl = this.config.site_url;

    if (!baseUrl || this.config.show_preview_links === false) {
      return;
    }

    return {
      url: previewUrlFormatter(baseUrl, collection, slug, entry, this.config.slug),
      status: 'SUCCESS',
    };
  }

  /**
   * Requests a base URL from the backend for previewing a specific entry.
   * Supports polling via `maxAttempts` and `interval` options, as there is
   * often a delay before a preview URL is available.
   */
  async getDeployPreview(
    collection: Collection,
    slug: string,
    entry: EntryMap,
    { maxAttempts = 1, interval = 5000 } = {},
  ) {
    /**
     * If the registered backend does not provide a `getDeployPreview` method, or
     * `show_preview_links` in the config is set to false, do nothing.
     */
    if (!this.implementation.getDeployPreview || this.config.show_preview_links === false) {
      return;
    }

    /**
     * Poll for the deploy preview URL (defaults to 1 attempt, so no polling by
     * default).
     */
    let deployPreview,
      count = 0;
    while (!deployPreview && count < maxAttempts) {
      count++;
      deployPreview = await this.implementation.getDeployPreview(collection.get('name'), slug);
      if (!deployPreview) {
        await new Promise(resolve => setTimeout(() => resolve(undefined), interval));
      }
    }

    /**
     * If there's no deploy preview, do nothing.
     */
    if (!deployPreview) {
      return;
    }

    return {
      /**
       * Create a URL using the collection `preview_path`, if provided.
       */
      url: previewUrlFormatter(deployPreview.url, collection, slug, entry, this.config.slug),
      /**
       * Always capitalize the status for consistency.
       */
      status: deployPreview.status ? deployPreview.status.toUpperCase() : '',
    };
  }

  async persistEntry({
    config,
    collection,
    entryDraft: draft,
    assetProxies,
    usedSlugs,
    unpublished = false,
    status,
  }: PersistArgs) {
    const updatedEntity = await this.invokePreSaveEvent(draft.get('entry'));

    let entryDraft;
    if (updatedEntity.get('data') === undefined) {
      entryDraft = (updatedEntity && draft.setIn(['entry', 'data'], updatedEntity)) || draft;
    } else {
      entryDraft = (updatedEntity && draft.setIn(['entry'], updatedEntity)) || draft;
    }

    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;

    const useWorkflow = selectUseWorkflow(config);

    const customPath = selectCustomPath(collection, entryDraft);

    let dataFile: DataFile;
    if (newEntry) {
      if (!selectAllowNewEntries(collection)) {
        throw new Error('Not allowed to create new entries in this collection');
      }
      const slug = await this.generateUniqueSlug(
        collection,
        entryDraft.getIn(['entry', 'data']),
        config,
        usedSlugs,
        customPath,
      );
      const path = customPath || (selectEntryPath(collection, slug) as string);
      dataFile = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };

      updateAssetProxies(assetProxies, config, collection, entryDraft, path);
    } else {
      const slug = entryDraft.getIn(['entry', 'slug']);
      dataFile = {
        path: entryDraft.getIn(['entry', 'path']),
        // for workflow entries we refresh the slug on publish
        slug: customPath && !useWorkflow ? slugFromCustomPath(collection, customPath) : slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
        newPath: customPath,
      };
    }

    const { slug, path, newPath } = dataFile;

    let dataFiles = [dataFile];
    if (hasI18n(collection)) {
      const extension = selectFolderEntryExtension(collection);
      dataFiles = getI18nFiles(
        collection,
        extension,
        entryDraft.get('entry'),
        (draftData: EntryMap) => this.entryToRaw(collection, draftData),
        path,
        slug,
        newPath,
      );
    }

    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      newEntry ? 'create' : 'update',
      config,
      {
        collection,
        slug,
        path,
        authorLogin: user.login,
        authorName: user.name,
      },
      user.useOpenAuthoring,
    );

    const collectionName = collection.get('name');

    const updatedOptions = { unpublished, status };
    const opts = {
      newEntry,
      commitMessage,
      collectionName,
      useWorkflow,
      ...updatedOptions,
    };

    if (!useWorkflow) {
      await this.invokePrePublishEvent(entryDraft.get('entry'));
    }

    await this.implementation.persistEntry(
      {
        dataFiles,
        assets: assetProxies,
      },
      opts,
    );

    await this.invokePostSaveEvent(entryDraft.get('entry'));

    if (!useWorkflow) {
      await this.invokePostPublishEvent(entryDraft.get('entry'));
    }

    return slug;
  }

  async invokeEventWithEntry(event: string, entry: EntryMap) {
    const { login, name } = (await this.currentUser()) as User;
    return await invokeEvent({ name: event, data: { entry, author: { login, name } } });
  }

  async invokePrePublishEvent(entry: EntryMap) {
    await this.invokeEventWithEntry('prePublish', entry);
  }

  async invokePostPublishEvent(entry: EntryMap) {
    await this.invokeEventWithEntry('postPublish', entry);
  }

  async invokePreUnpublishEvent(entry: EntryMap) {
    await this.invokeEventWithEntry('preUnpublish', entry);
  }

  async invokePostUnpublishEvent(entry: EntryMap) {
    await this.invokeEventWithEntry('postUnpublish', entry);
  }

  async invokePreSaveEvent(entry: EntryMap) {
    return await this.invokeEventWithEntry('preSave', entry);
  }

  async invokePostSaveEvent(entry: EntryMap) {
    await this.invokeEventWithEntry('postSave', entry);
  }

  async persistMedia(config: CmsConfig, file: AssetProxy) {
    const user = (await this.currentUser()) as User;
    const options = {
      commitMessage: commitMessageFormatter(
        'uploadMedia',
        config,
        {
          path: file.path,
          authorLogin: user.login,
          authorName: user.name,
        },
        user.useOpenAuthoring,
      ),
    };
    return this.implementation.persistMedia(file, options);
  }

  async deleteEntry(state: State, collection: Collection, slug: string) {
    const config = state.config;
    const path = selectEntryPath(collection, slug) as string;
    const extension = selectFolderEntryExtension(collection) as string;

    if (!selectAllowDeletion(collection)) {
      throw new Error('Not allowed to delete entries in this collection');
    }

    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      'delete',
      config,
      {
        collection,
        slug,
        path,
        authorLogin: user.login,
        authorName: user.name,
      },
      user.useOpenAuthoring,
    );

    const entry = selectEntry(state.entries, collection.get('name'), slug);
    await this.invokePreUnpublishEvent(entry);
    let paths = [path];
    if (hasI18n(collection)) {
      paths = getFilePaths(collection, extension, path, slug);
    }
    await this.implementation.deleteFiles(paths, commitMessage);

    await this.invokePostUnpublishEvent(entry);
  }

  async deleteMedia(config: CmsConfig, path: string) {
    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      'deleteMedia',
      config,
      {
        path,
        authorLogin: user.login,
        authorName: user.name,
      },
      user.useOpenAuthoring,
    );
    return this.implementation.deleteFiles([path], commitMessage);
  }

  persistUnpublishedEntry(args: PersistArgs) {
    return this.persistEntry({ ...args, unpublished: true });
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    return this.implementation.updateUnpublishedEntryStatus!(collection, slug, newStatus);
  }

  async publishUnpublishedEntry(entry: EntryMap) {
    const collection = entry.get('collection');
    const slug = entry.get('slug');

    await this.invokePrePublishEvent(entry);
    await this.implementation.publishUnpublishedEntry!(collection, slug);
    await this.invokePostPublishEvent(entry);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    return this.implementation.deleteUnpublishedEntry!(collection, slug);
  }

  entryToRaw(collection: Collection, entry: EntryMap): string {
    const format = resolveFormat(collection, entry.toJS());
    const fieldsOrder = this.fieldsOrder(collection, entry);
    const fieldsComments = selectFieldsComments(collection, entry);
    let content = format.toFile(entry.get('data').toJS(), fieldsOrder, fieldsComments);
    if (content.slice(-1) != '\n') {
      // add the EOL if it does not exist.
      content += '\n';
    }
    return content;
  }

  fieldsOrder(collection: Collection, entry: EntryMap) {
    const fields = collection.get('fields');
    if (fields) {
      return collection
        .get('fields')
        .map(f => f!.get('name'))
        .toArray();
    }

    const files = collection.get('files');
    const file = (files || List<CollectionFile>())
      .filter(f => f!.get('name') === entry.get('slug'))
      .get(0);

    if (file == null) {
      throw new Error(`No file found for ${entry.get('slug')} in ${collection.get('name')}`);
    }
    return file
      .get('fields')
      .map(f => f!.get('name'))
      .toArray();
  }

  filterEntries(collection: { entries: EntryValue[] }, filterRule: FilterRule) {
    return collection.entries.filter(entry => {
      const fieldValue = entry.data[filterRule.get('field')];
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterRule.get('value'));
      }
      return fieldValue === filterRule.get('value');
    });
  }
}

export function resolveBackend(config: CmsConfig) {
  if (!config.backend.name) {
    throw new Error('No backend defined in configuration');
  }

  const { name } = config.backend;
  const authStore = new LocalStorageAuthStore();

  const backend = getBackend(name);
  if (!backend) {
    throw new Error(`Backend not found: ${name}`);
  } else {
    return new Backend(backend, { backendName: name, authStore, config });
  }
}

export const currentBackend = (function () {
  let backend: Backend;

  return (config: CmsConfig) => {
    if (backend) {
      return backend;
    }

    return (backend = resolveBackend(config));
  };
})();
