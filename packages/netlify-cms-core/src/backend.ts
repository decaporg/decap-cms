import { attempt, flatten, isError, uniq } from 'lodash';
import { List, Map, fromJS } from 'immutable';
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
} from './reducers/collections';
import { createEntry, EntryValue } from './valueObjects/Entry';
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
} from 'netlify-cms-lib-util';
import { status } from './constants/publishModes';
import { extractTemplateVars, dateParsers } from './lib/stringTemplate';
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

const extractSearchFields = (searchFields: string[]) => (entry: EntryValue) =>
  searchFields.reduce((acc, field) => {
    const nestedFields = field.split('.');
    let f = entry.data;
    for (let i = 0; i < nestedFields.length; i++) {
      f = f[nestedFields[i]];
      if (!f) break;
    }
    return f ? `${acc} ${f}` : acc;
  }, '');

const sortByScore = (a: fuzzy.FilterResult<EntryValue>, b: fuzzy.FilterResult<EntryValue>) => {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
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

interface ImplementationInitOptions {
  useWorkflow: boolean;
  updateUserCredentials: (credentials: Credentials) => void;
  initialWorkflowStatus: string;
}

type Implementation = BackendImplementation & {
  init: (config: ImplementationConfig, options: ImplementationInitOptions) => Implementation;
};

export class Backend {
  implementation: Implementation;
  backendName: string;
  authStore: AuthStore | null;
  config: Config;
  user?: User | null;

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

  logout() {
    return Promise.resolve(this.implementation.logout()).then(() => {
      this.user = null;
      if (this.authStore) {
        this.authStore.logout();
      }
    });
  }

  getToken = () => this.implementation.getToken();

  async entryExist(collection: Collection, path: string, slug: string, useWorkflow: boolean) {
    const unpublishedEntry =
      useWorkflow &&
      (await this.implementation.unpublishedEntry(collection.get('name'), slug).catch(error => {
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
  ) {
    const slugConfig = config.get('slug');
    const slug: string = slugFormatter(collection, entryData, slugConfig);
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
        { raw: loadedEntry.data || '', label: loadedEntry.file.label },
      ),
    );
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const filteredEntries = collectionFilter
      ? this.filterEntries({ entries: formattedEntries }, collectionFilter)
      : formattedEntries;
    return filteredEntries;
  }

  listEntries(collection: Collection) {
    const extension = selectFolderEntryExtension(collection);
    let listMethod: () => Promise<ImplementationEntry[]>;
    const collectionType = collection.get('type');
    if (collectionType === FOLDER) {
      listMethod = () =>
        this.implementation.entriesByFolder(
          collection.get('folder') as string,
          extension,
          getPathDepth(collection.get('path', '') as string),
        );
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
    return listMethod().then((loadedEntries: ImplementationEntry[]) => ({
      entries: this.processEntries(loadedEntries, collection),
      /*
          Wrap cursors so we can tell which collection the cursor is
          from. This is done to prevent traverseCursor from requiring a
          `collection` argument.
        */
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      cursor: Cursor.create(loadedEntries[CURSOR_COMPATIBILITY_SYMBOL]).wrapData({
        cursorType: 'collectionEntries',
        collection,
      }),
    }));
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection: Collection) {
    if (collection.get('folder') && this.implementation.allEntriesByFolder) {
      const extension = selectFolderEntryExtension(collection);
      return this.implementation
        .allEntriesByFolder(
          collection.get('folder') as string,
          extension,
          getPathDepth(collection.get('path', '') as string),
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
        const searchFields = [
          selectInferedField(collection, 'title'),
          selectInferedField(collection, 'shortTitle'),
          selectInferedField(collection, 'author'),
          ...summaryFields.map(elem => {
            if (dateParsers[elem]) {
              return selectInferedField(collection, 'date');
            }
            return elem;
          }),
        ].filter(Boolean) as string[];
        const collectionEntries = await this.listAllEntries(collection);
        return fuzzy.filter(searchTerm, collectionEntries, {
          extract: extractSearchFields(uniq(searchFields)),
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

  async query(collection: Collection, searchFields: string[], searchTerm: string) {
    const entries = await this.listAllEntries(collection);
    const hits = fuzzy
      .filter(searchTerm, entries, { extract: extractSearchFields(searchFields) })
      .sort(sortByScore)
      .map(f => f.original);
    return { query: searchTerm, hits };
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
      createEntry(collection.get('name'), slug, path, { raw, label, mediaFiles }),
    );

    return { entry };
  }

  async persistLocalDraftBackup(entry: EntryMap, collection: Collection) {
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
    return localForage.setItem(getEntryBackupKey(), raw);
  }

  async deleteLocalDraftBackup(collection: Collection, slug: string) {
    const key = getEntryBackupKey(collection.get('name'), slug);
    await localForage.removeItem(key);
    return this.deleteAnonymousBackup();
  }

  // Unnamed backup for use in the global error boundary, should always be
  // deleted on cms load.
  deleteAnonymousBackup() {
    return localForage.removeItem(getEntryBackupKey());
  }

  async getEntry(state: State, collection: Collection, slug: string) {
    const path = selectEntryPath(collection, slug) as string;
    const label = selectFileEntryLabel(collection, slug);

    const integration = selectIntegration(state.integrations, null, 'assetStore');

    const loadedEntry = await this.implementation.getEntry(path);
    const entry = createEntry(collection.get('name'), slug, loadedEntry.file.path, {
      raw: loadedEntry.data,
      label,
      mediaFiles: [],
    });

    const entryWithFormat = this.entryWithFormat(collection)(entry);
    const mediaFolders = selectMediaFolders(state, collection, fromJS(entryWithFormat));
    if (mediaFolders.length > 0 && !integration) {
      entry.mediaFiles = [];
      for (const folder of mediaFolders) {
        entry.mediaFiles = [...entry.mediaFiles, ...(await this.implementation.getMedia(folder))];
      }
    } else {
      entry.mediaFiles = state.mediaLibrary.get('files') || [];
    }

    return entryWithFormat;
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

  entryWithFormat(collectionOrEntity: unknown) {
    return (entry: EntryValue): EntryValue => {
      const format = resolveFormat(collectionOrEntity, entry);
      if (entry && entry.raw !== undefined) {
        const data = (format && attempt(format.fromFile.bind(format, entry.raw))) || {};
        if (isError(data)) console.error(data);
        return Object.assign(entry, { data: isError(data) ? {} : data });
      }
      return format.fromFile(entry);
    };
  }

  unpublishedEntries(collections: Collections) {
    return this.implementation.unpublishedEntries!()
      .then(entries =>
        entries.map(loadedEntry => {
          const collectionName = loadedEntry.metaData!.collection;
          const collection = collections.find(c => c.get('name') === collectionName);
          const entry = createEntry(collectionName, loadedEntry.slug, loadedEntry.file.path, {
            raw: loadedEntry.data,
            isModification: loadedEntry.isModification,
            label: selectFileEntryLabel(collection, loadedEntry.slug!),
          });
          entry.metaData = loadedEntry.metaData;
          return entry;
        }),
      )
      .then(entries => ({
        pagination: 0,
        entries: entries.reduce((acc, entry) => {
          const collection = collections.get(entry.collection);
          if (collection) {
            acc.push(this.entryWithFormat(collection)(entry) as EntryValue);
          }
          return acc;
        }, [] as EntryValue[]),
      }));
  }

  unpublishedEntry(collection: Collection, slug: string) {
    return this.implementation!.unpublishedEntry!(collection.get('name') as string, slug)
      .then(loadedEntry => {
        const entry = createEntry(collection.get('name'), loadedEntry.slug, loadedEntry.file.path, {
          raw: loadedEntry.data,
          isModification: loadedEntry.isModification,
          metaData: loadedEntry.metaData,
          mediaFiles: loadedEntry.mediaFiles,
        });
        return entry;
      })
      .then(this.entryWithFormat(collection));
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
    entryDraft,
    assetProxies,
    usedSlugs,
    unpublished = false,
    status,
  }: PersistArgs) {
    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;

    const parsedData = {
      title: entryDraft.getIn(['entry', 'data', 'title'], 'No Title') as string,
      description: entryDraft.getIn(['entry', 'data', 'description'], 'No Description!') as string,
    };

    let entryObj: {
      path: string;
      slug: string;
      raw: string;
    };

    if (newEntry) {
      if (!selectAllowNewEntries(collection)) {
        throw new Error('Not allowed to create new entries in this collection');
      }
      const slug = await this.generateUniqueSlug(
        collection,
        entryDraft.getIn(['entry', 'data']),
        config,
        usedSlugs,
      );
      const path = selectEntryPath(collection, slug) as string;

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
      const path = entryDraft.getIn(['entry', 'path']);
      const slug = entryDraft.getIn(['entry', 'slug']);
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };
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

    const useWorkflow = selectUseWorkflow(config);

    const collectionName = collection.get('name');

    const updatedOptions = { unpublished, status };
    const opts = {
      newEntry,
      parsedData,
      commitMessage,
      collectionName,
      useWorkflow,
      ...updatedOptions,
    };

    if (!useWorkflow) {
      await this.invokePrePublishEvent(entryDraft.get('entry'));
    }

    await this.implementation.persistEntry(entryObj, assetProxies, opts);

    if (!useWorkflow) {
      await this.invokePostPublishEvent(entryDraft.get('entry'));
    }

    return entryObj.slug;
  }

  async invokeEventWithEntry(event: string, entry: EntryMap) {
    const { login, name } = (await this.currentUser()) as User;
    await invokeEvent({ name: event, data: { entry, author: { login, name } } });
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
    const path = selectEntryPath(collection, slug) as string;

    if (!selectAllowDeletion(collection)) {
      throw new Error('Not allowed to delete entries in this collection');
    }

    const config = state.config;
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
    const result = await this.implementation.deleteFile(path, commitMessage);
    await this.invokePostUnpublishEvent(entry);
    return result;
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
    return format && format.toFile(entry.get('data').toJS(), fieldsOrder);
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
