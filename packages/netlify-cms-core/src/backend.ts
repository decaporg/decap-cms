import { attempt, flatten, isError, uniq, trim, sortBy, groupBy, get, set } from 'lodash';
import { List, Map, fromJS, Set } from 'immutable';
import * as fuzzy from 'fuzzy';
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
  selectInferedField,
  selectMediaFolders,
  selectFieldsComments,
  selectHasMetaPath,
  hasMultiContent,
  hasMultiContentDiffFiles,
} from './reducers/collections';
import { createEntry, EntryValue, MultiContentArgs } from './valueObjects/Entry';
import { sanitizeChar } from './lib/urlHelper';
import { getBackend, invokeEvent } from './lib/registry';
import { commitMessageFormatter, slugFormatter, previewUrlFormatter } from './lib/formatters';
import {
  localForage,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
  Implementation as BackendImplementation,
  DisplayURL,
  ImplementationEntry,
  Credentials,
  User,
  getPathDepth,
  Config as ImplementationConfig,
  blobToFileObj,
  asyncLock,
  AsyncLock,
  UnpublishedEntry,
} from 'netlify-cms-lib-util';
import { basename, join, extname, dirname } from 'path';
import { status } from './constants/publishModes';
import { stringTemplate } from 'netlify-cms-lib-widgets';
import {
  Collection,
  EntryMap,
  Config,
  FilterRule,
  Collections,
  EntryDraft,
  CollectionFile,
  State,
  EntryField,
} from './types/redux';
import AssetProxy from './valueObjects/AssetProxy';
import { FOLDER, FILES } from './constants/collectionTypes';
import { selectCustomPath } from './reducers/entryDraft';
import { LOCALE_FILE_EXTENSIONS, LOCALE_FOLDERS } from './constants/multiContentTypes';

const { extractTemplateVars, dateParsers, expandPath } = stringTemplate;

export class LocalStorageAuthStore {
  storageKey = 'netlify-cms-user';

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

const getEntryField = (field: string, entry: EntryValue) => {
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
};

export const extractSearchFields = (searchFields: string[]) => (entry: EntryValue) =>
  searchFields.reduce((acc, field) => {
    const value = getEntryField(field, entry);
    if (value) {
      return `${acc} ${value}`;
    } else {
      return acc;
    }
  }, '');

export const expandSearchEntries = (entries: EntryValue[], searchFields: string[]) => {
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
};

export const mergeExpandedEntries = (entries: (EntryValue & { field: string })[]) => {
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
};

const sortByScore = (a: fuzzy.FilterResult<EntryValue>, b: fuzzy.FilterResult<EntryValue>) => {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
};

export const slugFromCustomPath = (collection: Collection, customPath: string) => {
  const folderPath = collection.get('folder', '') as string;
  const entryPath = customPath.toLowerCase().replace(folderPath.toLowerCase(), '');
  const slug = join(dirname(trim(entryPath, '/')), basename(entryPath, extname(customPath)));
  return slug;
};

interface AuthStore {
  retrieve: () => User;
  store: (user: User) => void;
  logout: () => void;
}

interface BackendOptions {
  backendName?: string;
  authStore?: AuthStore | null;
  config?: Config;
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
}

interface PersistArgs {
  config: Config;
  collection: Collection;
  entryDraft: EntryDraft;
  assetProxies: AssetProxy[];
  usedSlugs: List<string>;
  unpublished?: boolean;
  status?: string;
}

interface EntryObj {
  path: string;
  slug: string;
  raw: string;
  newPath?: string;
}

interface ImplementationInitOptions {
  useWorkflow: boolean;
  updateUserCredentials: (credentials: Credentials) => void;
  initialWorkflowStatus: string;
}

type Implementation = BackendImplementation & {
  init: (config: ImplementationConfig, options: ImplementationInitOptions) => Implementation;
};

const prepareMetaPath = (path: string, collection: Collection) => {
  if (!selectHasMetaPath(collection)) {
    return path;
  }
  const dir = dirname(path);
  return dir.substr(collection.get('folder')!.length + 1) || '/';
};

const entryLocale = (collection: Collection, slug: string) => {
  return collection.get('i18n_structure') === LOCALE_FILE_EXTENSIONS
    ? slug.split('.').pop()
    : slug.split('/').shift();
};

const collectionDepth = (collection: Collection) => {
  let depth;
  depth =
    collection.get('nested')?.get('depth') || getPathDepth(collection.get('path', '') as string);

  if (hasMultiContent(collection) && collection.get('i18n_structure') === LOCALE_FOLDERS) {
    depth = 2;
  }

  return depth;
};

export class Backend {
  implementation: Implementation;
  backendName: string;
  authStore: AuthStore | null;
  config: Config;
  user?: User | null;
  backupSync: AsyncLock;

  constructor(
    implementation: Implementation,
    { backendName, authStore = null, config }: BackendOptions = {},
  ) {
    // We can't reliably run this on exit, so we do cleanup on load.
    this.deleteAnonymousBackup();
    this.config = config as Config;
    this.implementation = implementation.init(this.config.toJS(), {
      useWorkflow: selectUseWorkflow(this.config),
      updateUserCredentials: this.updateUserCredentials,
      initialWorkflowStatus: status.first(),
    });
    this.backendName = backendName as string;
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
      auth: { status: false },
      api: { status: false, statusPage: '' },
    };
    for (let i = 1; i <= attempts; i++) {
      status = await this.implementation!.status();
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
          if (error instanceof EditorialWorkflowError && error.notUnderEditorialWorkflow) {
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
    config: Config,
    usedSlugs: List<string>,
    customPath: string | undefined,
  ) {
    const slugConfig = config.get('slug');
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
    const collectionFilter = collection.get('filter');
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
        },
      ),
    );
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const filteredEntries = collectionFilter
      ? this.filterEntries({ entries: formattedEntries }, collectionFilter)
      : formattedEntries;
    return filteredEntries;
  }

  async listEntries(collection: Collection) {
    const extension = selectFolderEntryExtension(collection);
    let listMethod: () => Promise<ImplementationEntry[]>;
    const collectionType = collection.get('type');
    if (collectionType === FOLDER) {
      const depth = collectionDepth(collection);
      listMethod = () => {
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
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
    const depth = collectionDepth(collection);
    if (collection.get('folder') && this.implementation.allEntriesByFolder) {
      const extension = selectFolderEntryExtension(collection);
      return this.implementation
        .allEntriesByFolder(collection.get('folder') as string, extension, depth)
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

  async listAllMultipleEntires(collection: Collection) {
    const i18nStructure = collection.get('i18n_structure');
    const locales = collection.get('locales') as List<string>;
    const entries = await this.listAllEntries(collection);
    let multiEntries;
    if (i18nStructure === LOCALE_FILE_EXTENSIONS) {
      multiEntries = entries
        .filter(entry => locales.some(l => entry.slug.endsWith(`.${l}`)))
        .map(entry => {
          const locale = entryLocale(collection, entry.slug);
          return {
            ...entry,
            slug: entry.slug.replace(`.${locale}`, ''),
            contentKey: entry.path.replace(`.${locale}`, ''),
            i18nStructure,
            locale,
          };
        });
    } else if (i18nStructure === LOCALE_FOLDERS) {
      multiEntries = entries
        .filter(entry => locales.some(l => entry.slug.startsWith(`${l}/`)))
        .map(entry => {
          const locale = entryLocale(collection, entry.slug);
          return {
            ...entry,
            slug: entry.slug.replace(`${locale}/`, ''),
            contentKey: entry.path.replace(`${locale}/`, ''),
            i18nStructure,
            locale,
          };
        });
    }

    return this.mergeMultipleContentEntries(multiEntries as EntryValue[]);
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
            selectInferedField(collection, 'title'),
            selectInferedField(collection, 'shortTitle'),
            selectInferedField(collection, 'author'),
            ...summaryFields.map(elem => {
              if (dateParsers[elem]) {
                return selectInferedField(collection, 'date');
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      throw new Error({ message: 'Errors ocurred while searching entries locally!', errors });
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
    const entry: EntryValue = this.entryWithFormat(collection)(
      createEntry(collection.get('name'), slug, path, {
        raw,
        label,
        mediaFiles,
        meta: { path: prepareMetaPath(path, collection) },
      }),
    );

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

      await localForage.setItem<BackupEntry>(key, {
        raw,
        path: entry.get('path'),
        mediaFiles,
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
    const multiContent = hasMultiContent(collection);
    const i18nStructure = collection.get('i18n_structure');
    const locales = collection?.get('locales')?.toJS() as string[];
    let loadedEntries;

    if (multiContent && i18nStructure === LOCALE_FILE_EXTENSIONS) {
      loadedEntries = await Promise.all(
        locales.map(locale =>
          this.implementation
            .getEntry(path.replace(extension, `${locale}.${extension}`))
            .then(entry => (entry.data ? entry : null))
            .catch(() => null),
        ),
      );
    } else if (multiContent && i18nStructure === LOCALE_FOLDERS) {
      loadedEntries = await Promise.all(
        locales.map(locale =>
          this.implementation
            .getEntry(path.replace(`/${slug}`, `/${locale}/${slug}`))
            .then(entry => (entry.data ? entry : null))
            .catch(() => null),
        ),
      );
    } else {
      const loadedEntry = await this.implementation.getEntry(path);
      loadedEntries = [loadedEntry];
    }

    const filteredLoadedEntries = loadedEntries.filter(Boolean) as ImplementationEntry[];
    const entries = await Promise.all(
      filteredLoadedEntries.map(async loadedEntry => {
        const locale = entryLocale(
          collection,
          selectEntrySlug(collection, loadedEntry.file.path) as string,
        );
        let entry = createEntry(collection.get('name'), slug, loadedEntry.file.path, {
          raw: loadedEntry.data,
          label,
          i18nStructure,
          locale,
          mediaFiles: [],
          meta: { path: prepareMetaPath(loadedEntry.file.path, collection) },
        });

        entry = this.entryWithFormat(collection)(entry);
        entry = await this.processEntry(state, collection, entry);

        return entry;
      }),
    );

    if (hasMultiContentDiffFiles(collection)) {
      return this.mergeEntries(entries);
    }

    return entries[0];
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

    let data;
    let entryWithFormat;
    let newFile = false;
    let path = slug;
    // if the unpublished entry has no diffs, return the original
    if (dataFiles.length <= 0) {
      const loadedEntry = await this.implementation.getEntry(
        selectEntryPath(collection, slug) as string,
      );
      data = loadedEntry.data;
      path = loadedEntry.file.path;
    } else if (hasMultiContentDiffFiles(collection)) {
      data = await Promise.all(
        dataFiles.map(async file => {
          const data = await this.implementation.unpublishedEntryDataFile(
            collection.get('name'),
            entryData.slug,
            file.path,
            file.id,
          );
          return { data, path: file.path };
        }),
      );
      newFile = dataFiles[0].newFile;
      path = dataFiles[0].path;
    } else {
      const entryFile = dataFiles[0];
      data = await this.implementation.unpublishedEntryDataFile(
        collection.get('name'),
        entryData.slug,
        entryFile.path,
        entryFile.id,
      );
      newFile = entryFile.newFile;
      path = entryFile.path;
    }

    if (Array.isArray(data)) {
      const multipleEntries = data.map(d => {
        const i18nStructure = collection.get('i18n_structure');
        const locale = entryLocale(collection, selectEntrySlug(collection, d.path) as string);

        return this.entryWithFormat(collection)(
          createEntry(collection.get('name'), slug, path, {
            raw: d.data,
            isModification: !newFile,
            label: collection && selectFileEntryLabel(collection, slug),
            mediaFiles,
            updatedOn: entryData.updatedAt,
            status: entryData.status,
            meta: { path: prepareMetaPath(path, collection) },
            i18nStructure,
            locale,
          }),
        );
      });

      entryWithFormat = this.mergeEntries(multipleEntries);
    } else {
      const entry = createEntry(collection.get('name'), slug, path, {
        raw: data,
        isModification: !newFile,
        label: collection && selectFileEntryLabel(collection, slug),
        mediaFiles,
        updatedOn: entryData.updatedAt,
        status: entryData.status,
        meta: { path: prepareMetaPath(path, collection) },
      });

      entryWithFormat = this.entryWithFormat(collection)(entry);
    }

    return entryWithFormat;
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
    const mediaFolders = selectMediaFolders(state, collection, fromJS(entry));
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

  mergeMultipleContentEntries(entries: (EntryValue & MultiContentArgs)[]) {
    const groupEntries = groupBy(entries, e => e.contentKey);
    return Object.keys(groupEntries).reduce((acc: EntryValue[], key: string) => {
      const entries = groupEntries[key];
      return [...acc, this.mergeEntries(entries)];
    }, []);
  }

  mergeEntries(entries: (EntryValue & MultiContentArgs)[]) {
    const { i18nStructure, contentKey, locale, ...entry } = entries[0];
    const data: { [key: string]: any } = {};
    let path = '';

    entries.forEach((e: EntryValue & MultiContentArgs) => {
      if (i18nStructure === LOCALE_FILE_EXTENSIONS) {
        !path && (path = e.path.replace(`.${e.locale}`, ''));
        data[e.locale as string] = e.data;
      } else if (i18nStructure === LOCALE_FOLDERS) {
        !path && (path = e.path.replace(`${e.locale}/`, ''));
        data[e.locale as string] = e.data;
      }
    });
    return { ...entry, path, raw: '', data, multiContent: true };
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

    const baseUrl = this.config.get('site_url');

    if (!baseUrl || this.config.get('show_preview_links') === false) {
      return;
    }

    return {
      url: previewUrlFormatter(baseUrl, collection, slug, this.config.get('slug'), entry),
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
    if (!this.implementation.getDeployPreview || this.config.get('show_preview_links') === false) {
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
        await new Promise(resolve => setTimeout(() => resolve(), interval));
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
      url: previewUrlFormatter(deployPreview.url, collection, slug, this.config.get('slug'), entry),
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
    const modifiedData = await this.invokePreSaveEvent(draft.get('entry'));
    const entryDraft = (modifiedData && draft.setIn(['entry', 'data'], modifiedData)) || draft;

    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;

    const useWorkflow = selectUseWorkflow(config);

    let entryObj: EntryObj;

    const customPath = selectCustomPath(collection, entryDraft);

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
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };

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
    } else {
      const slug = entryDraft.getIn(['entry', 'slug']);
      entryObj = {
        path: entryDraft.getIn(['entry', 'path']),
        // for workflow entries we refresh the slug on publish
        slug: customPath && !useWorkflow ? slugFromCustomPath(collection, customPath) : slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
        newPath: customPath,
      };
    }

    let entriesObj = [entryObj];
    if (hasMultiContentDiffFiles(collection)) {
      entriesObj = this.getMultipleEntries(collection, entryDraft, entryObj);
    }

    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      newEntry ? 'create' : 'update',
      config,
      {
        collection,
        slug: entryObj.slug,
        path: entryObj.path,
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

    await this.implementation.persistEntry(entriesObj, assetProxies, opts);

    await this.invokePostSaveEvent(entryDraft.get('entry'));

    if (!useWorkflow) {
      await this.invokePostPublishEvent(entryDraft.get('entry'));
    }

    return entryObj.slug;
  }

  getMultipleEntries(collection: Collection, entryDraft: EntryDraft, entryObj: EntryObj) {
    const i18nStructure = collection.get('i18n_structure');
    const extension = selectFolderEntryExtension(collection);
    const data = entryDraft.getIn(['entry', 'data']).toJS();
    const locales = Object.keys(data);
    const entriesObj: EntryObj[] = [];
    if (i18nStructure === LOCALE_FILE_EXTENSIONS) {
      locales.forEach(l => {
        entriesObj.push({
          path: entryObj.path.replace(extension, `${l}.${extension}`),
          slug: entryObj.slug,
          raw: this.entryToRaw(
            collection,
            entryDraft.get('entry').set('data', entryDraft.getIn(['entry', 'data', l])),
          ),
          ...(entryObj.newPath && {
            newPath: entryObj.newPath,
          }),
        });
      });
    } else if (i18nStructure === LOCALE_FOLDERS) {
      locales.forEach(l => {
        entriesObj.push({
          path: entryObj.path.replace(`/${entryObj.slug}`, `/${l}/${entryObj.slug}`),
          slug: entryObj.slug,
          raw: this.entryToRaw(
            collection,
            entryDraft.get('entry').set('data', entryDraft.getIn(['entry', 'data', l])),
          ),
          ...(entryObj.newPath && {
            newPath: entryObj.newPath,
          }),
        });
      });
    }

    return entriesObj;
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

  async persistMedia(config: Config, file: AssetProxy) {
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
    const locales = collection.get('locales')!.toJS() as string[];

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
    if (hasMultiContentDiffFiles(collection)) {
      const i18nStructure = collection.get('i18n_structure') as string;
      if (i18nStructure === LOCALE_FILE_EXTENSIONS) {
        for (const l of locales) {
          await this.implementation
            .deleteFile(path.replace(extension, `${l}.${extension}`), commitMessage)
            .catch(() => undefined);
        }
      } else if (i18nStructure === LOCALE_FOLDERS) {
        for (const l of locales) {
          await this.implementation
            .deleteFile(path.replace(`/${slug}`, `/${l}/${slug}`), commitMessage)
            .catch(() => undefined);
        }
      }
    } else {
      await this.implementation.deleteFile(path, commitMessage);
    }
    await this.invokePostUnpublishEvent(entry);
    return Promise.resolve();
  }

  async deleteMedia(config: Config, path: string) {
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
    return this.implementation.deleteFile(path, commitMessage);
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
    return format && format.toFile(entry.get('data').toJS(), fieldsOrder, fieldsComments);
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

export function resolveBackend(config: Config) {
  const name = config.getIn(['backend', 'name']);
  if (name == null) {
    throw new Error('No backend defined in configuration');
  }

  const authStore = new LocalStorageAuthStore();

  const backend = getBackend(name);
  if (!backend) {
    throw new Error(`Backend not found: ${name}`);
  } else {
    return new Backend(backend, { backendName: name, authStore, config });
  }
}

export const currentBackend = (function() {
  let backend: Backend;

  return (config: Config) => {
    if (backend) {
      return backend;
    }

    return (backend = resolveBackend(config));
  };
})();
